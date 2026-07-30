import Foundation
import Speech
import AVFoundation

final class SFSpeechEngine: RecognizerEngine {
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var speechRecognizer: SFSpeechRecognizer?
    private var resultBatches: [String] = []

    private let lg = Lg(prefix: "SFSpeechEngine")

    override func stop() {
        super.stop()
        recognitionRequest?.endAudio()
        recognitionTask?.finish()
    }
    
    override func prewarm(
        forPrewarm: Bool,
        _ options: SpeechRecognitionPrewarm? = nil
    ) async {
        speechRecognizer = SFSpeechRecognizer(
            locale: Locale(identifier: self.recognizerDelegate?.config?.locale ?? "en-US")
        )
        if speechRecognizer?.isAvailable != true {
            self.retry(from: "prewarm.isAvailable", isPrewarm: forPrewarm)
            return
        }
        if self.recognizerDelegate?.config?.onDevice == OnDeviceMode.require &&
           speechRecognizer?.supportsOnDeviceRecognition != true {
            self.reportError(
                from: "prewarm.supportsOnDeviceRecognition",
                code: SpeechRecognitionError.ondevicenotsupported
            )
            return
        }
        await super.prewarm(forPrewarm: forPrewarm, options)
    }
    
    override func startSession() async {
        await super.startSession()
        lg.log("[startSession.startSession]")
        
        await prewarm(forPrewarm: false)
        lg.log("[startSession.prewarm]")
        guard let speechRecognizer else { return }
        
        let recognizerQ = OperationQueue()
        recognizerQ.name = Self.queueLabel
        recognizerQ.maxConcurrentOperationCount = 1
        recognizerQ.underlyingQueue = queue
        
        speechRecognizer.queue = recognizerQ
        
        
        recognitionRequest = createRecognitionRequest()
        guard let recognitionRequest else { return }
        lg.log("[startSession.createRecognitionRequest]")
        
        recognitionTask = speechRecognizer.recognitionTask(
            with: recognitionRequest
        ) { [weak self] result, error in
            guard let self else { return }
            
            if let result = result {
                var transcription = result.bestTranscription.formattedString
                if !transcription.isEmpty {
                    // Track only when transcription is coming
                    self.trackPartialActivity()
                    
                    let disableRepeatingFilter = self.recognizerDelegate?.config?.disableRepeatingFilter ?? false
                    if !disableRepeatingFilter {
                        transcription = Utils.repeatingFilter(transcription)
                    }
                    
                    let batchInProgress = result.speechRecognitionMetadata?.speechStartTimestamp == nil
                    
                    if self.resultBatches.isEmpty {
                        // add first batch
                        self.resultBatches.append(transcription)
                    } else if batchInProgress {
                        // replace last batch
                        self.resultBatches[self.resultBatches.count - 1] = transcription
                    } else {
                        // batch is completed
                        self.resultBatches[self.resultBatches.count - 1] = transcription
                        // reserve a slot for next
                        self.resultBatches.append("")
                    }
                    
                    var batches = self.resultBatches
                    if batches.last == "" {
                        batches.removeLast()
                    }
                    
                    self.recognizerDelegate?.result(batches: batches)
                }
                
                if result.isFinal {
                    self.cleanup(from: "startRecognition.recognitionTask.final")
                }
            }
            
            if error != nil {
                if !self.isStopping {
                    lg.log("[startSession.recognitionTask.error] \(error)")
                    self.reportError(
                        from: "startSession.recognitionTask.error",
                        code: SpeechRecognitionError.recognitiontaskfailed
                    )
                } else {
                    // Manual stop, not an error
                    self.cleanup(from: "startRecognition.recognitionTask.manualStop")
                }
            }
        }
        lg.log("[startSession.recognitionTask]")
        
        self.startAudioEngine(
            onBuffer: { [weak self] buffer in
                self?.recognitionRequest?.append(buffer)
            }
        )
        lg.log("[startSession.startAudioEngine]")
        
        self.sendFeedbackOnStart()
        lg.log("[startSession.sendFeedbackOnStart]")
    }
    
    override func cleanup(from: String) {
        super.cleanup(from: "overridden.\(from)")
        recognitionRequest = nil
        recognitionTask = nil
        speechRecognizer = nil
        resultBatches = []
    }
    
    private func createRecognitionRequest() -> SFSpeechAudioBufferRecognitionRequest {
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        
        if let contextualStrings = self.recognizerDelegate?.config?.contextualStrings,
           !contextualStrings.isEmpty {
            request.contextualStrings = contextualStrings
        }
        
        // onDevice prefer or required
        if let onDevice = self.recognizerDelegate?.config?.onDevice {
            // check happens on prewarm
            request.requiresOnDeviceRecognition = true
            lg.log("[createRecognitionRequest.requiresOnDeviceRecognition.true]")
        }
        
        if #available(iOS 16, *) {
            if self.recognizerDelegate?.config?.iosAddPunctuation == false {
                request.addsPunctuation = false
            } else {
                request.addsPunctuation = true
            }
        }
        
        return request
    }
}
