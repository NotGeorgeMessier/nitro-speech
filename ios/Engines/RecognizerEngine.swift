import Foundation
import Speech
import AVFoundation

// No practical diff between "system" and "onSession" for now.
// For future: send the level of error to RN
// "onSession" is less critical level, since the session has been started successfully
enum FailureType {
    case system
    case start
    case prewarm
    case onSession
}

enum PrewarmType {
    case start
    case prewarm
}

class RecognizerEngine {
    var isActive = false
    var isStopping = false
    weak var recognizerDelegate: RecognizerDelegate?
    
    private let audioLevelTracker = AudioLevelTracker()
    private var appStateObserver: AppStateObserver?
    private var audioEngine: AVAudioEngine?
    private var autoStopper: AutoStopper?
    private let lg = Lg(prefix: "RecognizerEngine")
    
    let locale: Locale
    
    init(locale: Locale, delegate: RecognizerDelegate) {
        self.locale = locale
        self.recognizerDelegate = delegate
    }
    
    // MARK: - Recognizer Methods
    
    func prewarm(for type: PrewarmType, _ options: SpeechRecognitionPrewarm? = nil) async {
        // Prepare audioEngine
        audioEngine = AVAudioEngine()
        lg.log("[prewarm.audioEngine]")
        
        guard let recognizerDelegate else { return }
        
        // Everything is set, return early
        if type == .prewarm, recognizerDelegate.hardwareFormat != nil {
            lg.log("[prewarm.return]: Everything set")
            return
        }
        
        // User explicitly asked for prewarm without requesting permissions, return early
        if type == .prewarm, options?.requestPermission == false {
            lg.log("[prewarm.return]: requestPermission: false")
            return
        }
        
        if type == .prewarm {
            // options.requestPermission is true by default
            // Start Permission sequence
            let granted = await requestPermissions()
            if granted {
                self.prewarmAudioSession(for: type)
            }
        } else {
            self.prewarmAudioSession(for: type)
        }
        
        // for SpeechTranscriber: .isAvailable and async assets
        // for Dictation: only async assets
        // for legacy SF: only sync .isAvailable
    }
    
    func start() async {
        guard !isActive else { return }
        
        let granted = await requestPermissions()
        if granted {
            await startSession()
        }
    }
    
    func stop() {
        guard isActive, !isStopping else { return }
        isStopping = true
        HapticImpact.trigger(with: self.recognizerDelegate?.config?.stopHapticFeedbackStyle)
    }
    
    func updateSession(
        newConfig: MutableSpeechRecognitionConfig? = nil,
        addMsToTimer: Double? = nil,
        resetTimer: Bool? = nil
    ) {
        guard let recognizerDelegate, isActive, !isStopping else { return }
        let currentConfig = recognizerDelegate.config
        // Update AutoFinish time
        if let newAutoFinish = newConfig?.autoFinishRecognitionMs,
           newAutoFinish != currentConfig?.autoFinishRecognitionMs {
            autoStopper?.updateThreshold(
                newAutoFinish,
                from: "updateSession"
            )
        }
        // Update AutoFinish progress interval
        if let newInterval = newConfig?.autoFinishProgressIntervalMs,
           newInterval != currentConfig?.autoFinishProgressIntervalMs {
            autoStopper?.updateProgressInterval(
                newInterval,
                from: "updateSession"
            )
        }
        
        if let addMsToTimer {
            // Add time to the timer once
            autoStopper?.addMsOnce(
                addMsToTimer,
                from: "updateSession"
            )
        } else if resetTimer == true {
            // Reset to current baseline threshold.
            autoStopper?.resetTimer(from: "updateSession")
        }
        // Only update new non-nil values in the config
        recognizerDelegate.softlyUpdateConfig(newConfig: newConfig)
    }

    func getVoiceInputVolume() -> VolumeChangeEvent? {
        guard let currentSample = audioLevelTracker.currentSample else { return nil }
        return VolumeChangeEvent(
            smoothedVolume: currentSample.smoothed,
            rawVolume: currentSample.raw,
            db: currentSample.db
        )
    }
    
    // MARK: Helpers
    
    func startSession() async {
        lg.log("[startSession.startSession]")
        // Init everything
        isStopping = false
        isActive = true
        
        initAutoStop()
        lg.log("[startSession.initAutoStop]")
        startAppStateObserver()
        lg.log("[startSession.startAppStateObserver]")
    }
    
    func startAudioEngine(
        onBuffer: @escaping (AVAudioPCMBuffer) -> Void
    ) {
        lg.log("[startAudioEngine]")
        guard let audioEngine, let hardwareFormat = self.recognizerDelegate?.hardwareFormat else { return }
        audioEngine.inputNode.installTap(
            onBus: 0,
            bufferSize: 1024,
            format: hardwareFormat
        ) { [weak self] buffer, _ in
            guard let self, let recognizerDelegate = self.recognizerDelegate else { return }
            if let sample = self.audioLevelTracker.process(
                buffer,
                recognizerDelegate.config?.resetAutoFinishVoiceSensitivity
            ) {
                // Send buffer volume data
                recognizerDelegate.volumeChange(
                    event:
                        VolumeChangeEvent(
                            smoothedVolume: sample.smoothed,
                            rawVolume: sample.raw,
                            db: sample.db
                        )
                )
                if sample.resetTimer {
                    self.autoStopper?.resetTimer(from: "rms threshold")
                }
            }
            onBuffer(buffer)
        }
        lg.log("[startAudioEngine.installTap]")
        do {
            audioEngine.prepare()
            lg.log("[startAudioEngine.prepare]")
            try audioEngine.start()
            lg.log("[startAudioEngine.start]")
        } catch {
            self.reportFailure(
                from: "Audio Engine",
                message: "Audio Engine failed to start",
                // RecognizerEngine-agnostic Error
                type: .system
            )
        }
    }
    
    func sendFeedbackOnStart() {
        guard let recognizerDelegate else { return }
        lg.log("[sendFeedbackOnStart]")
        HapticImpact.trigger(with: recognizerDelegate.config?.startHapticFeedbackStyle)
        autoStopper?.resetTimer(from: "startListening.sendFeedbackOnStart")
        recognizerDelegate.readyForSpeech()
        recognizerDelegate.result(batches: [])
    }

    func cleanup(from: String) {
        lg.log("[cleanup]: \(from)")
        let wasActive = isActive
        deinitAutoStop()
        stopAppStateObserver()
        stopAudioSession()
        audioLevelTracker.reset()
        
        if let audioEngine, audioEngine.isRunning {
            audioEngine.stop()
        }
        audioEngine?.inputNode.removeTap(onBus: 0)
        
        audioEngine = nil
        isActive = false
        isStopping = false
        self.recognizerDelegate?.volumeChange(
            event:
                VolumeChangeEvent(
                    smoothedVolume: 0,
                    rawVolume: 0,
                    db: nil
                )
        )
        if wasActive {
            self.recognizerDelegate?.recordingStopped()
        }
    }
    
    func reportFailure(from: String, message: String, type: FailureType) {
        // Log message
        lg.log("[Failure] type: \(type), message: \(message)")
        
        // Cleanup on engine level anyway
        self.cleanup(from: from)
        
        switch type {
            // Try to reselect engine and try again
            case .prewarm, .start:
                let isPrewarm = type == .prewarm
                self.recognizerDelegate?.reselectEngine(forPrewarm: isPrewarm)
            // System level issue: send onError with description and clean
            // Session has already started: send onError and cleanup
            case .system, .onSession:
                self.recognizerDelegate?.error(message: message)
        }
    }
    
    func trackPartialActivity() {
        if !self.isStopping {
            self.autoStopper?.resetTimer(from: "Partial results")
        }
    }
    
    // MARK: Permissions
    
    private func requestPermissions() async -> Bool {
        guard let recognizerDelegate else { return false }
        let authStatus = await Permissions.requestAuthorization()
        if authStatus == .denied || authStatus == .restricted {
            recognizerDelegate.permissionDenied()
            return false
        }
        
        if authStatus != .authorized {
            // .notDetermined or unknown issue
            recognizerDelegate.error(message: "Speech recognition permission is not determined")
            return false
        }
        
        if !(await Permissions.requestMicrophonePermission()) {
            recognizerDelegate.permissionDenied()
            return false
        }
        
        // Granted
        return true
    }
    
    // MARK: Auto Stopper
    
    private func initAutoStop() {
        let config = self.recognizerDelegate?.config
        autoStopper = AutoStopper(
            silenceThresholdMs: config?.autoFinishRecognitionMs,
            progressIntervalMs: config?.autoFinishProgressIntervalMs,
            onProgress: { [weak self] timeLeftMs in
                guard let self else { return }
                self.recognizerDelegate?.autoFinishProgress(
                    timeLeftMs: timeLeftMs
                )
            },
            onTimeout: { [weak self] in
                self?.stop()
            }
        )
    }
    private func deinitAutoStop() {
        autoStopper?.stop()
        autoStopper = nil
    }
    
    // MARK: App State Observer
    
    private func startAppStateObserver() {
        appStateObserver = AppStateObserver { [weak self] in
            guard let self, self.isActive else { return }
            self.stop()
        }
    }
    
    private func stopAppStateObserver() {
        appStateObserver?.stop()
        appStateObserver = nil
    }
    
    // MARK: Audio Session
    
    private func prewarmAudioSession(for type: PrewarmType) {
        guard let audioEngine else {
            self.reportFailure(
                from: "Audio Engine",
                message: "Audio Engine failed to initiate",
                // RecognizerEngine-agnostic Error
                type: .system
            )
            return
        }
        startAudioSession()
        lg.log("[prewarmAudioSession.audioSession]")
        // heavy first hardwareFormat retrieval
        if let recognizerDelegate, recognizerDelegate.hardwareFormat == nil {
            let format = audioEngine.inputNode.outputFormat(forBus: 0)
            recognizerDelegate.setHardwareFormat(format: format)
            lg.log("[prewarmAudioSession.hardwareFormat]")
        }
        
        if type == .prewarm {
            stopAudioSession()
            lg.log("[prewarmAudioSession.stopAudioSession]")
        }
    }
    
    private func startAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .default, options: .duckOthers)
            // Required for haptic feedback
            try audioSession.setAllowHapticsAndSystemSoundsDuringRecording(true)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            self.reportFailure(
                from: "startAudioSession",
                message: "Failed to activate audio session: \(error.localizedDescription)",
                // RecognizerEngine-agnostic Error
                type: .system
            )
        }
    }
    private func stopAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setActive(false)
        } catch {
            // Just log and no-op - not critical
            lg.log("Failed to deactivate audio session: \(error.localizedDescription)")
        }
    }
}
