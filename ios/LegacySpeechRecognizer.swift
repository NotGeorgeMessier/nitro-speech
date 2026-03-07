import Foundation
import Speech
import NitroModules
import AVFoundation

class LegacySpeechRecognizer: HybridRecognizer {
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    
    override init() {
        super.init()
        self.supportedLocales = SFSpeechRecognizer.supportedLocales().map {loc in loc.identifier}
    }
    
    override func dispose() {
        super.dispose()
        self.stopListening()
    }
    
    override func stopListening() {
        super.stopListening()

        // Signal end of audio and request graceful finish
        recognitionRequest?.endAudio()
        recognitionTask?.finish()
    }
    
    override func handleInternalStopTrigger() {
        self.stopListening()
    }

    override func requestMicrophonePermission() {
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                guard let self = self else { return }

                if granted {
                    self.startRecognition()
                } else {
                    self.onPermissionDenied?()
                }
            }
        }
    }

    override func startRecognition() {
        guard self.startRecognitionSetup() else { return }

        let locale = Locale(identifier: config?.locale ?? "en-US")
        guard let speechRecognizer = SFSpeechRecognizer(locale: locale), speechRecognizer.isAvailable
        else {
            onError?("Speech recognizer is not available")
            self.cleanup(from: "startRecognition.speechRecognizer")
            return
        }

        recognitionRequest = createRecognitionRequest()
        guard let recognitionRequest else {
            onError?("Failed to create recognition request")
            self.cleanup(from: "startRecognition.recognitionRequest")
            return
        }

        recognitionTask = speechRecognizer.recognitionTask(
            with: recognitionRequest
        ) { [weak self] result, error in
          guard let self = self else { return }
         
          if let result = result {
              self.trackPartialActivity()
              var transcription = result.bestTranscription.formattedString
              if !transcription.isEmpty {
                  let disableRepeatingFilter = config?.disableRepeatingFilter ?? false
                  if !disableRepeatingFilter {
                      transcription = self.repeatingFilter(text: transcription)
                  }
                  self.onResult?([transcription])
              }
             
              // Task completed - cleanup whether natural or manual stop
              if result.isFinal {
                  self.cleanup(from: "startRecognition.recognitionTask.final")
              }
          }
         
          if let error = error {
              // Only report error if not intentionally stopping
              if !self.isStopping {
                  self.onError?("Recognition error: \(error.localizedDescription)")
              }
              self.cleanup(from: "startRecognition.recognitionTask.error")
          }
        }

        audioEngine = AVAudioEngine()
        guard let audioEngine else {
            onError?("Failed to create audio engine")
            self.cleanup(from: "startRecognition.createAudioEngine")
            return
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
            self.recognitionRequest?.append(buffer)
        }

        do {
            audioEngine.prepare()
            try audioEngine.start()
        } catch {
            onError?("Failed to start audio engine: \(error.localizedDescription)")
            self.cleanup(from: "startRecognition.startAudioEngine")
            return
        }
        
        self.startRecognitionFeedback()
    }

    override func cleanup(from: String) {
        let wasActive = isActive

        super.cleanup(from: "overrider.\(from)")

        recognitionRequest = nil
        recognitionTask = nil

        if wasActive {
          onRecordingStopped?()
        }
    }
    
    private func createRecognitionRequest() -> SFSpeechAudioBufferRecognitionRequest {
        let request = SFSpeechAudioBufferRecognitionRequest()

        request.shouldReportPartialResults = true

        if let contextualStrings = config?.contextualStrings, !contextualStrings.isEmpty {
            request.contextualStrings = contextualStrings
        }

        if #available(iOS 16, *) {
          if let addPunctiation = config?.iosAddPunctuation, addPunctiation == false {
              request.addsPunctuation = false
          } else {
              request.addsPunctuation = true
          }
        }
        
        return request
    }
}
