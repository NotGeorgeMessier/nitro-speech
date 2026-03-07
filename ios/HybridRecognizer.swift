import Foundation
import Speech
import NitroModules
import os.log
import AVFoundation

class HybridRecognizer: HybridRecognizerSpec {
    internal static let isDebug = true
    internal func logger(_ string: String) -> Void {
        if Self.isDebug {
            Logger(subsystem: "com.margelo.nitro.nitrospeech", category: "Recognizer").info("\(string)")
        }
    }

    internal static let defaultAutoFinishRecognitionMs = 8000.0
    internal static let speechRmsThreshold: Float = 0.005623
    
    var onReadyForSpeech: (() -> Void)?
    var onRecordingStopped: (() -> Void)?
    var onResult: (([String]) -> Void)?
    var onAutoFinishProgress: ((Double) -> Void)?
    var onError: ((String) -> Void)?
    var onPermissionDenied: (() -> Void)?
    var onVolumeChange: ((Double) -> Void)?
    
    internal var audioEngine: AVAudioEngine?
    
    internal var autoStopper: AutoStopper?
    internal var appStateObserver: AppStateObserver?
    internal var isActive: Bool = false
    internal var isStopping: Bool = false
    internal var config: SpeechToTextParams?
    internal var levelSmoothed: Float = 0
    internal var supportedLocales: [String] = []
    
    func getIsActive() -> Bool {
        return self.isActive
    }
    
    func startListening(params: SpeechToTextParams) {
        if isActive {
            return
        }
        
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            Task { @MainActor in
                guard let self = self else { return }
                
                self.config = params
                
                switch authStatus {
                case .authorized:
                    self.requestMicrophonePermission()
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

    func dispose() {
        stopListening()
    }
    
    func stopListening() {
        guard isActive, !isStopping else { return }
        isStopping = true
        
        self.stopHapticFeedback()
    }
    
    internal func handleInternalStopTrigger() {
        self.stopListening()
    }
    
    func addAutoFinishTime(additionalTimeMs: Double?) {
        guard isActive, !isStopping else { return }
        
        autoStopper?.indicateRecordingActivity(
            from: "refreshAutoFinish",
            addMsToThreshold: additionalTimeMs
        )
    }
    
    func updateAutoFinishTime(newTimeMs: Double, withRefresh: Bool?) {
        guard isActive, !isStopping else { return }
        
        autoStopper?.updateSilenceThreshold(newThresholdMs: newTimeMs)
        
        if withRefresh == true {
            autoStopper?.indicateRecordingActivity(
                from: "updateAutoFinishTime",
                addMsToThreshold: nil
            )
        }
    }
    
    func getSupportedLocalesIOS() -> [String] {
        return self.supportedLocales
    }

    internal func requestMicrophonePermission() {}
    
    internal func startRecognitionSetup() -> Bool {
        isStopping = false
        isActive = true
        
        initAutoStop()
        monitorAppState()
        guard startAudioSession() else {
            cleanup(from: "startRecognitionSetup")
            return false
        }
        
        return true
    }
    
    internal func startRecognitionFeedback() {
        self.startHapticFeedback()
        autoStopper?.indicateRecordingActivity(
            from: "startListening",
            addMsToThreshold: nil
        )
        onReadyForSpeech?()
        onResult?([])
    }
    
    internal func startRecognition() {}
    internal func startRecognition() async {}
    
    internal func cleanup(from: String) {
        logger("[cleanup]: \(from)")
        deinitAutoStop()
        stopMonitorAppState()
        stopAudioSession()
        stopAudioEngine()
        levelSmoothed = 0
        isActive = false
        isStopping = false
        onVolumeChange?(0)
    }
    
    internal func stopAudioEngine() {
        if let audioEngine = audioEngine, audioEngine.isRunning {
            audioEngine.stop()
        }
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine = nil
    }
    
    internal func monitorAppState() {
        appStateObserver = AppStateObserver { [weak self] in
            guard let self = self, self.isActive else { return }
            self.handleInternalStopTrigger()
        }
    }
    internal func stopMonitorAppState () {
        appStateObserver?.stop()
        appStateObserver = nil
    }
    
    internal func initAutoStop() {
        autoStopper = AutoStopper(
            silenceThresholdMs: config?.autoFinishRecognitionMs ?? Self.defaultAutoFinishRecognitionMs,
            onProgress: { [weak self] timeLeftMs in
                self?.onAutoFinishProgress?(timeLeftMs)
            },
            onTimeout: { [weak self] in
                self?.handleInternalStopTrigger()
            }
        )
    }
    internal func deinitAutoStop () {
        autoStopper?.stop()
        autoStopper = nil
    }
    
    internal func startAudioSession() -> Bool {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            // Without this, iOS may suppress haptics while recording.
            try audioSession.setAllowHapticsAndSystemSoundsDuringRecording(true)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            return true
        } catch {
            onError?("Failed to activate audio session: \(error.localizedDescription)")
            return false
        }
    }
    internal func stopAudioSession () {
        do {
            try AVAudioSession.sharedInstance().setActive(false)
        } catch {
            logger("Failed to deactivate audio session: \(error.localizedDescription)")
            return
        }
    }
    
    internal func startHapticFeedback() {
        if let hapticStyle = config?.startHapticFeedbackStyle {
            HapticImpact(style: hapticStyle).trigger()
        } else {
            HapticImpact(style: .medium).trigger()
        }
    }
    internal func stopHapticFeedback () {
        if let hapticStyle = config?.stopHapticFeedbackStyle {
            HapticImpact(style: hapticStyle).trigger()
        } else {
            HapticImpact(style: .medium).trigger()
        }
    }
    
    internal func trackPartialActivity() {
        if !self.isStopping {
            self.autoStopper?.indicateRecordingActivity(
                from: "partial results",
                addMsToThreshold: nil
            )
        }
    }

    internal func repeatingFilter(text: String) -> String {
        var subStrings = text.split { $0.isWhitespace }.map { String($0) }
        // filter out unnecessary punctiation
        if #available(iOS 16.0, *) {
            var shift = 0
            //
            while !subStrings[shift].contains(/\w+/) {
                shift += 1
            }
            if shift > 0 {
                subStrings = Array(subStrings.suffix(subStrings.count - shift))
            }
        }
        var joiner = ""
        // 10 - arbitrary number of last substrings that is still unstable
        // and needs to be filtered. Prev substrings were handled earlier.
        if subStrings.count >= 10 {
            joiner = subStrings.prefix(subStrings.count - 9).joined(separator: " ")
            subStrings = Array(subStrings.suffix(10))
        } else {
            joiner = subStrings.first ?? ""
        }
        for i in subStrings.indices {
            if i == 0 { continue }
            // Always add number-contained strings
            if #available(iOS 16.0, *), subStrings[i].contains(/\d+/) {
                joiner += " \(subStrings[i])"
                continue
            }
            
            // Skip consecutive duplicate strings
            if subStrings[i] == subStrings[i-1] { continue }
            joiner += " \(subStrings[i])"
        }
        return joiner
    }
}
