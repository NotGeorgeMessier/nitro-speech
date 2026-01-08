import Foundation
import Speech
import NitroModules

class HybridRecognizer: HybridRecognizerSpec {
    var onReadyForSpeech: (() -> Void)?
    var onRecordingStopped: (() -> Void)?
    var onResult: (([String]) -> Void)?
    var onError: ((String) -> Void)?
    var onPermissionDenied: (() -> Void)?
    
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var audioEngine: AVAudioEngine?
    private var autoStopper: AutoStopper?
    private var appStateObserver: AppStateObserver?
    private var isActive: Bool = false
    
    func startListening(params: SpeechToTextParams) {
        if isActive {
            onError?("Previous recognition session is still active")
            return
        }
        
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            DispatchQueue.main.async {
                guard let self = self else { return }
                
                switch authStatus {
                case .authorized:
                    self.requestMicrophonePermission(params: params)
                case .denied, .restricted:
                    self.onPermissionDenied?()
                case .notDetermined:
                    self.onError?("Speech recognition not determined")
                @unknown default:
                    self.onError?("Unknown authorization status")
                }
            }
        }
    }
    
    func stopListening() {
        autoStopper?.stop()
        recognitionRequest?.endAudio()
        cleanup()
        onRecordingStopped?()
    }
    
    func destroy() {
        autoStopper?.stop()
        autoStopper = nil
        recognitionTask?.cancel()
        cleanup()
    }

    private func requestMicrophonePermission(params: SpeechToTextParams) {
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                guard let self = self else { return }
                
                if granted {
                    self.startRecognition(params: params)
                } else {
                    self.onPermissionDenied?()
                }
            }
        }
    }
    
    private func startRecognition(params: SpeechToTextParams) {
        let locale = Locale(identifier: params.locale ?? "en-US")
        speechRecognizer = SFSpeechRecognizer(locale: locale)
        
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            onError?("Speech recognizer not available")
            return
        }
        
        // Set up auto-stopper with timeout (default 8 seconds)
        let timeoutMs = params.autoFinishRecognitionMs ?? 8000
        autoStopper = AutoStopper(silenceThresholdMs: timeoutMs) { [weak self] in
            self?.onRecordingStopped?()
            self?.stopListening()
        }
        
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            onError?("Failed to set up audio session: \(error.localizedDescription)")
            return
        }
        
        audioEngine = AVAudioEngine()
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        
        guard let recognitionRequest = recognitionRequest, let audioEngine = audioEngine else {
            onError?("Failed to create recognition request or audio engine")
            return
        }
        
        recognitionRequest.shouldReportPartialResults = true
        
        if let contextualStrings = params.contextualStrings, !contextualStrings.isEmpty {
            recognitionRequest.contextualStrings = contextualStrings
        }
        
        if #available(iOS 16, *) {
            if let addPunctiation = params.iosAddPunctuation, addPunctiation == false {
                recognitionRequest.addsPunctuation = false
            } else {
                recognitionRequest.addsPunctuation = true
            }
        }
        
        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            
            if let result = result {
                // Indicate activity on partial results
                self.autoStopper?.indicateRecordingActivity(from: "partial results")
                
                var transcription = result.bestTranscription.formattedString
                if !transcription.isEmpty {
                    if !(params.disableRepeatingFilter ?? false) {
                        transcription = self.repeatingFilter(text: transcription)
                    }
                    self.onResult?([transcription])
                }
                
                if result.isFinal {
                    self.autoStopper?.stop()
                    self.cleanup()
                    self.onRecordingStopped?()
                }
            }
            
            if let error = error {
                self.autoStopper?.stop()
                self.cleanup()
                self.onError?("Recognition error: \(error.localizedDescription)")
                self.onRecordingStopped?()
            }
        }
        
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
            // Indicate activity on audio input
            self?.autoStopper?.indicateRecordingActivity(from: "audio input")
        }
        
        // Observe app going to background
        appStateObserver = AppStateObserver { [weak self] in
            guard let self = self, self.isActive else { return }
            self.stopListening()
        }
        
        do {
            audioEngine.prepare()
            try audioEngine.start()
            isActive = true
            autoStopper?.indicateRecordingActivity(from: "startListening")
            onReadyForSpeech?()
            onResult?([])
        } catch {
            cleanup()
            onError?("Failed to start audio engine: \(error.localizedDescription)")
        }
    }
    
    private func cleanup() {
        appStateObserver?.stop()
        appStateObserver = nil
        
        if let audioEngine = audioEngine, audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        
        recognitionRequest = nil
        recognitionTask = nil
        audioEngine = nil
        isActive = false
    }

    private func repeatingFilter(text: String) -> String {
        let words = text.split { $0.isWhitespace }.map { String($0) }
        var joiner = words[0]
        for i in words.indices {
            if i == 0 || words[i] == words[i-1] {continue}
            joiner += " \(words[i])"
        }
        return joiner
    }
}
