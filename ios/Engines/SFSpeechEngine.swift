import Foundation
import Speech
import AVFoundation

final class SFSpeechEngine: RecognizerEngine {
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var speechRecognizer: SFSpeechRecognizer?

    private let lg = Lg(prefix: "SFSpeechEngine")

    override func stop() {
        super.stop()
        recognitionRequest?.endAudio()
        recognitionTask?.finish()
    }
    
    override func prewarm(for type: FailureType) async -> Bool {
        speechRecognizer = SFSpeechRecognizer(
            locale: Locale(identifier: config?.locale ?? "en-US")
        )
        if speechRecognizer?.isAvailable != true {
            self.reportFailure(
                from: "prewarm",
                message: "SFSpeechRecognizer is not available",
                type: type
            )
            return false
        }
        return true
    }
    
    override func startSession() async {
        await super.startSession()
        lg.log("[startSession.startSession]")
        
        guard await prewarm(for: .start) else { return }
        lg.log("[startSession.prewarm]")
        // prepare already ensures speechRecognizer exists
        // otherwise logs error and cleanup
        guard let speechRecognizer else { return }
        
        recognitionRequest = createRecognitionRequest()
        lg.log("[startSession.createRecognitionRequest]")
        guard let recognitionRequest else { return }
        
        recognitionTask = speechRecognizer.recognitionTask(
            with: recognitionRequest
        ) { [weak self] result, error in
            guard let self else { return }
            
            if let result = result {
                self.trackPartialActivity()
                var transcription = result.bestTranscription.formattedString
                if !transcription.isEmpty {
                    let disableRepeatingFilter = self.config?.disableRepeatingFilter ?? false
                    if !disableRepeatingFilter {
                        transcription = Utils.repeatingFilter(transcription)
                    }
                    self.onResult?([transcription])
                }
                
                if result.isFinal {
                    self.cleanup(from: "startRecognition.recognitionTask.final")
                }
            }
            
            if let error = error {
                if !self.isStopping {
                    self.reportFailure(
                        from: "startSession.recognitionTask.error",
                        message: "Recognition Error: \(error.localizedDescription)",
                        type: .onSession
                    )
                } else {
                    self.cleanup(from: "startRecognition.recognitionTask.error")
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
    }
    
    private func createRecognitionRequest() -> SFSpeechAudioBufferRecognitionRequest {
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        
        if let contextualStrings = config?.contextualStrings, !contextualStrings.isEmpty {
            request.contextualStrings = contextualStrings
        }
        
        if #available(iOS 16, *) {
            if config?.iosAddPunctuation == false {
                request.addsPunctuation = false
            } else {
                request.addsPunctuation = true
            }
        }
        
        return request
    }
}
