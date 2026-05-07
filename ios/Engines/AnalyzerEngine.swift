import Foundation
import Speech
import AVFoundation

@available(iOS 26.0, *)
final class AnalyzerEngine: RecognizerEngine {
    private var inputSequence: AsyncStream<AnalyzerInput>?
    private var inputBuilder: AsyncStream<AnalyzerInput>.Continuation?
    private var outputContinuation: AsyncStream<AVAudioPCMBuffer>.Continuation?
    private var analyzer: SpeechAnalyzer?
    private let transcriber: TranscriberRuntime
    
    private var audioProducerTask: Task<Void, Never>?
    private var recognizerTask: Task<(), Error>?
    private var lastBatchStartTime: Float64? = nil
    private var resultBatches: [String] = []
    
    init(backend: RecognizerBackend, locale: Locale, delegate: RecognizerDelegate) {
        if backend == .speechTranscriber {
            transcriber = SpeechRuntime(with: locale)
        } else {
            transcriber = DictationRuntime(with: locale)
        }
        super.init(locale: locale, delegate: delegate)
    }
    
    override func stop() {
        super.stop()
        inputBuilder?.finish()
        
        Task { [weak self] in
            guard let self = self else { return }
            
            do {
                try await self.analyzer?.finalizeAndFinishThroughEndOfInput()
            } catch {
                self.reportFailure(
                    from: "stop.finalizeAndFinishThroughEndOfInput",
                    message: "Failed to finalize the end of input",
                    type: .onSession
                )
                await self.analyzer?.cancelAndFinishNow()
            }
            
            self.cleanup(from: "stopListening")
        }
    }
    
    override func prewarm(for type: FailureType) async {
        await super.prewarm(for: type)
        do {
            // Create transcriber and install assets
            try await transcriber.create(config: self.recognizerDelegate?.config)
        }
        catch {
            self.reportFailure(
                from: "prewarm.assets",
                message: "Failed to create transcriber",
                type: type
            )
        }
    }
    
    override func startSession() async {
        await super.startSession()
        
        // Prepares transcriber and handles errors.
        // On failure, reportFailure triggers cleanup + engine reselection.
        await prewarm(for: .start)
        
        // 3. Input sequence
        (inputSequence, inputBuilder) = AsyncStream.makeStream(of: AnalyzerInput.self)
        
        let modules = transcriber.getModules()
        // 4. Analyzer
        guard let audioFormat = await SpeechAnalyzer.bestAvailableAudioFormat(
            compatibleWith: modules
        ) else {
            self.reportFailure(
                from: "startRecognition.SpeechAnalyzer.bestAvailableAudioFormat",
                message: "Failed to find SpeechAnalyzer audio format",
                type: .start
            )
            return
        }
        
        analyzer = SpeechAnalyzer(modules: modules)
        
        // 5. Supply audio
        audioProducerTask = Task {
            self.startAudioEngine(
                onBuffer: { [weak self] buffer in
                    self?.outputContinuation?.yield(buffer)
                }
            )
            guard let hardwareFormat else { return }
            let stream = AsyncStream(
                AVAudioPCMBuffer.self,
                bufferingPolicy: .unbounded
            ) { continuation in
                outputContinuation = continuation
            }
            
            let needsConversion =
                hardwareFormat.commonFormat != audioFormat.commonFormat ||
                hardwareFormat.sampleRate != audioFormat.sampleRate ||
                hardwareFormat.channelCount != audioFormat.channelCount
            do {
                guard let converter = AVAudioConverter(
                    from: hardwareFormat,
                    to: audioFormat
                ) else {
                    throw NSError()
                }
                for await pcmBuffer in stream {
                    if Task.isCancelled { break }
                    
                    let bufferForAnalyzer: AVAudioPCMBuffer
                    if needsConversion {
                        // Skip analyzing for empty buffers and
                        // Throw error if buffers are inconvertable
                        guard let convertedBuffer = try AudioBufferConverter.convertBuffer(
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
                self.reportFailure(
                    from: "startRecognition.audioProducerTask",
                    message: "Failed to convert audio format",
                    type: .start
                )
                return
            }
        }
        
        // 7. Handle the results
        recognizerTask = Task {
            do {
                try await transcriber.handleResults(
                    onResult: { [weak self] result in
                        guard let self else { return }
                        self.handleBatch(
                            attrString: result.text,
                            rangeStart: result.rangeStart,
                            isFinal: result.isFinal
                        )
                    }
                )
            } catch {
                if self.isStopping || error is CancellationError {
                    return
                }
                self.reportFailure(
                    from: "startRecognition.recognizerTask",
                    message: "Failed to retrieve transcriber result",
                    type: .onSession
                )
            }
        }
        
        do {
            if let inputSequence, let analyzer {
                if let contextualStrings = self.recognizerDelegate?.config?.contextualStrings {
                    let context = AnalysisContext()
                    context.contextualStrings = [
                        AnalysisContext.ContextualStringsTag.general: contextualStrings
                    ]
                    try await analyzer.setContext(context)
                }
                try await analyzer.start(inputSequence: inputSequence)
            }
        } catch {
            self.reportFailure(
                from: "startRecognition.analyzerStart",
                message: "Failed to start analyze input sequence",
                type: .start
            )
            return
        }

        self.sendFeedbackOnStart()
    }
    
    override func cleanup(from: String) {
        super.cleanup(from: "overridden.\(from)")

        inputSequence = nil
        inputBuilder = nil
        outputContinuation?.finish()
        outputContinuation = nil
        analyzer = nil
        transcriber.clean()
        audioProducerTask?.cancel()
        audioProducerTask = nil
        recognizerTask?.cancel()
        recognizerTask = nil
        lastBatchStartTime = nil
        resultBatches = []
    }
    
    private func handleBatch(attrString: AttributedString, rangeStart: CMTime, isFinal: Bool) {
        var newBatch = String(attrString.characters)
        // Ignore all batches without A-z0-9
        if !newBatch.contains(/\w+/) {
            return
        }
        // Track only when transcription is coming
        self.trackPartialActivity()
        
        let disableRepeatingFilter = self.recognizerDelegate?.config?.disableRepeatingFilter ?? false
        if !disableRepeatingFilter {
            newBatch = Utils.repeatingFilter(newBatch)
        }
        Log.log("[1] lastBatch: \(self.resultBatches.last ?? "") | newBatch: \(newBatch)")
        if self.resultBatches.isEmpty {
            self.resultBatches.append(newBatch)
        } else if CMTimeGetSeconds(rangeStart) == self.lastBatchStartTime || isFinal {
            Log.log("[2] replace, isFinal: \(isFinal)")
            self.resultBatches[self.resultBatches.count - 1] = newBatch
        } else {
            Log.log("[2] add new batch")
            self.resultBatches.append(newBatch)
        }
        self.lastBatchStartTime = CMTimeGetSeconds(rangeStart)
        self.recognizerDelegate?.result(batches: self.resultBatches)
    }
}
