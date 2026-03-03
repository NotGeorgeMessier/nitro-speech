import Foundation
import Speech
import NitroModules
import os.log
import AVFoundation

@available(iOS 26.0, *)
class AnalyzerTranscriber: HybridRecognizer {
    private var inputSequence: AsyncStream<AnalyzerInput>?
    private var inputBuilder: AsyncStream<AnalyzerInput>.Continuation?
    private var outputContinuation: AsyncStream<AVAudioPCMBuffer>.Continuation?
    private var analyzer: SpeechAnalyzer?
    private var speechTranscriber: SpeechTranscriber?
    private var dictationTranscriber: DictationTranscriber?
    private var audioProducerTask: Task<Void, Never>?
    private var recognizerTask: Task<(), Error>?
    private var lastBatchStartTime: Float64? = nil
    private var resultBatches: [String] = []
    
    override func dispose() {
        super.dispose()
        self.stopListening()
        self.deallocAssets()
    }
    
    override func stopListening() {
        super.stopListening()
        inputBuilder?.finish()
        
        Task { [weak self] in
            guard let self = self else { return }
            
            do {
                try await self.analyzer?.finalizeAndFinishThroughEndOfInput()
            } catch {
                self.onError?("Analyzer finalize failed during stop: \(error.localizedDescription)")
                await self.analyzer?.cancelAndFinishNow()
            }
            
            self.cleanup(from: "stopListening")
        }
    }

    override func handleInternalStopTrigger() {
        self.stopListening()
    }
    
    override func requestMicrophonePermission() {
        AVAudioApplication.requestRecordPermission { [weak self] granted in
            Task { @MainActor in
                guard let self = self else { return }
                
                if granted {
                    await self.startRecognition()
                } else {
                    self.onPermissionDenied?()
                }
            }
        }
    }
    
    override func startRecognition() async {
        guard self.startRecognitionSetup() else { return }

        // 1. Modules
        let supportedLocale = await SpeechTranscriber.supportedLocale(
            equivalentTo: Locale(identifier: config?.locale ?? "en-US")
        )
        if supportedLocale == nil {
            onError?("Unsupported locale name: en-US is used instead as default")
        }
        let locale = supportedLocale ?? Locale(identifier: "en-US")
        var speechTranscriptionOptions: Set<SpeechTranscriber.TranscriptionOption> = []
        if config?.maskOffensiveWords == true {
            speechTranscriptionOptions.insert(.etiquetteReplacements)
        }
        speechTranscriber = SpeechTranscriber(
            locale: locale,
            transcriptionOptions: speechTranscriptionOptions,
            reportingOptions: [.volatileResults, .fastResults],
            attributeOptions: [.audioTimeRange]
        )
        if speechTranscriber == nil || !SpeechTranscriber.isAvailable {
            // Punctuation is true by default
            var dictationTranscriptionOptions: Set<DictationTranscriber.TranscriptionOption> = [
                .punctuation
            ]
            if config?.maskOffensiveWords == true {
                dictationTranscriptionOptions.insert(.etiquetteReplacements)
            }
            if config?.iosAddPunctuation == false {
                dictationTranscriptionOptions.remove(.punctuation)
            }
            dictationTranscriber = DictationTranscriber(
                locale: locale,
                contentHints: [.shortForm],
                transcriptionOptions: dictationTranscriptionOptions,
                reportingOptions: [.frequentFinalization, .volatileResults],
                attributeOptions: [.audioTimeRange]
            )
        }
        
        var modules: [any SpeechModule]
        if let speechTranscriber {
            modules = [speechTranscriber]
            logger.info("[SpeechTranscriber] Activated")
        } else if let dictationTranscriber {
            modules = [dictationTranscriber]
            logger.info("[DictationTranscriber] Activated")
        } else {
            onError?("Failed to create Transcriber")
            self.cleanup(from: "startRecognition.Transcriber")
            return
        }
        
        // 2. Assets management
        guard await ensureAssetInventory(modules: modules) else {
            onError?("Speech assets installation failed")
            self.cleanup(from: "startRecognition.ensureAssetInventory")
            return
        }
        
        // 3. Input sequence
        (inputSequence, inputBuilder) = AsyncStream.makeStream(of: AnalyzerInput.self)
        
        // 4. Analyzer
        guard let audioFormat = await SpeechAnalyzer.bestAvailableAudioFormat(
            compatibleWith: modules
        ) else {
            onError?("Could not find SpeechAnalyzer audio format")
            self.cleanup(from: "startRecognition.SpeechAnalyzer.bestAvailableAudioFormat")
            return
        }
        
        analyzer = SpeechAnalyzer(modules: modules)
        
        // 5. Supply audio
        audioProducerTask = Task {
            do {
                audioEngine = AVAudioEngine()
                guard let audioEngine = audioEngine else {
                    throw NSError()
                }
                let hardwareFormat = audioEngine.inputNode.outputFormat(forBus: 0)
                audioEngine.inputNode.installTap(onBus: 0, bufferSize: 1024, format: hardwareFormat) { [weak self] buffer, time in
                    guard let self else {return}
                    let (rms, nextLevelSmoothed) = BufferUtil().calcRmsVolume(levelSmoothed: levelSmoothed, buffer: buffer) ?? (nil, nil)
                    
                    if let nextLevelSmoothed {
                        levelSmoothed = nextLevelSmoothed
                        let volume = Double(nextLevelSmoothed * 1_000_000).rounded() / 1_000_000
                        onVolumeChange?(volume)
                    }

                     if let rms, rms > Self.speechRmsThreshold {
                         self.autoStopper?.indicateRecordingActivity(
                             from: "rms change",
                             addMsToThreshold: nil
                         )
                     }
                    outputContinuation?.yield(buffer)
                }
                
                audioEngine.prepare()
                try audioEngine.start()
                
                let stream = AsyncStream(AVAudioPCMBuffer.self, bufferingPolicy: .unbounded) { continuation in
                    outputContinuation = continuation
                }
                
                let needsConversion =
                    hardwareFormat.commonFormat != audioFormat.commonFormat ||
                    hardwareFormat.sampleRate != audioFormat.sampleRate ||
                    hardwareFormat.channelCount != audioFormat.channelCount
                guard let converter = AVAudioConverter(from: hardwareFormat, to: audioFormat)
                else {
                    throw NSError()
                }
                
                for await pcmBuffer in stream {
                    if Task.isCancelled { break }
                    
                    let bufferForAnalyzer: AVAudioPCMBuffer
                    if needsConversion {
                        // Skip analyzing for empty buffers and
                        // Throw error if buffers are inconvertable
                        guard let convertedBuffer = try BufferUtil().convertBuffer(
                            converter: converter,
                            audioFormat: audioFormat,
                            pcmBuffer: pcmBuffer
                        ) else {
                            continue
                        }
                        bufferForAnalyzer = convertedBuffer
                    } else {
                        bufferForAnalyzer = pcmBuffer
                    }
                    
                    let input = AnalyzerInput(buffer: bufferForAnalyzer)
                    inputBuilder?.yield(input)
                }
            } catch {
                if Task.isCancelled || self.isStopping {
                    return
                }
                onError?("Audio producer failed while capturing microphone input: \(error.localizedDescription)")
                self.cleanup(from: "startRecognition.audioProducerTask")
                return
            }
        }
        
        // 7. Handle the results
        recognizerTask = Task {
            do {
                if let speechTranscriber {
                    for try await result in speechTranscriber.results {
                        self.trackPartialActivity()
                        self.handleBatches(
                            attrString: result.text,
                            rangeStart: result.range.start,
                            isFinal: result.isFinal
                        )
                    }
                } else if let dictationTranscriber {
                    for try await result in dictationTranscriber.results {
                        self.trackPartialActivity()
                        self.handleBatches(
                            attrString: result.text,
                            rangeStart: result.range.start,
                            isFinal: result.isFinal
                        )
                    }
                }
            } catch {
                if self.isStopping || error is CancellationError {
                    return
                }
                onError?("Transcriber results stream failed: \(error.localizedDescription)")
                self.cleanup(from: "startRecognition.recognizerTask")
            }
        }
        
        do {
            if let inputSequence, let analyzer {
                if let contextualStrings = config?.contextualStrings {
                    let context = AnalysisContext()
                    context.contextualStrings = [
                        AnalysisContext.ContextualStringsTag.general: contextualStrings
                    ]
                    try await analyzer.setContext(context)
                }
                try await analyzer.start(inputSequence: inputSequence)
            }
        } catch {
            onError?("Analyzer failed to start input sequence: \(error.localizedDescription)")
            self.cleanup(from: "startRecognition.analyzerStart")
            return
        }

        self.startRecognitionFeedback()
    }
    
    override func cleanup(from: String) {
        let wasActive = isActive
        
        super.cleanup(from: "overridden.\(from)")

        inputSequence = nil
        inputBuilder = nil
        outputContinuation?.finish()
        outputContinuation = nil
        analyzer = nil
        speechTranscriber = nil
        dictationTranscriber = nil
        audioProducerTask?.cancel()
        audioProducerTask = nil
        recognizerTask?.cancel()
        recognizerTask = nil
        lastBatchStartTime = nil
        resultBatches = []
        
        if wasActive {
            onRecordingStopped?()
        }
    }
    
    private func ensureAssetInventory(modules: [any SpeechModule]) async -> Bool {
        do {
            if let installationRequest = try await AssetInventory.assetInstallationRequest(supporting: modules) {
                try await installationRequest.downloadAndInstall()
            }
            return true
        }
        catch {
            return false
        }
    }
    
    private func deallocAssets() {
        Task {
            let reserved = await AssetInventory.reservedLocales
            for l in reserved {
                await AssetInventory.release(reservedLocale: l)
            }
        }
    }
    
    private func handleBatches(attrString: AttributedString, rangeStart: CMTime, isFinal: Bool) {
        var newBatch = String(attrString.characters)
        // Ignore all batches without A-z0-9
        if !newBatch.contains(/\w+/) {
            return
        }
        let disableRepeatingFilter = config?.disableRepeatingFilter ?? false
        if !disableRepeatingFilter {
            newBatch = self.repeatingFilter(text: newBatch)
        }
        logger.info("[1] lastBatch: \(self.resultBatches.last ?? "") | newBatch: \(newBatch)")
        if resultBatches.isEmpty {
            resultBatches.append(newBatch)
        } else if CMTimeGetSeconds(rangeStart) == lastBatchStartTime || isFinal {
            logger.info("[2] replace, isFinal: \(isFinal)")
            resultBatches[resultBatches.count - 1] = newBatch
        } else {
            logger.info("[2] add new batch")
            resultBatches.append(newBatch)
        }
        lastBatchStartTime = CMTimeGetSeconds(rangeStart)
        self.onResult?(resultBatches)
    }
}
