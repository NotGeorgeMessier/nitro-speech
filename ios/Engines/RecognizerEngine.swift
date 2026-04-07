import Foundation
import Speech
import AVFoundation

// No practical diff between "system" and "onSession" for now.
// For future: send the level of error to RN side
// "onSession" is less critical level, since the session has been started successfully
enum FailureType {
    case system
    case start
    case prewarm
    case onSession
}

class RecognizerEngine {
    var isActive = false
    var isStopping = false
    
    private var appStateObserver: AppStateObserver?
    private var audioEngine: AVAudioEngine?
    private let audioLevelTracker = AudioLevelTracker()
    private var autoStopper: AutoStopper?
    
    private let lg = Lg(prefix: "RecognizerEngine")
    
    var hardwareFormat: AVAudioFormat?

    let locale: Locale
    var config: SpeechToTextParams?
    var reselectEngine: ((_ forPrewarm: Bool) -> Void)?
    
    var onReady: (() -> Void)?
    var onStop: (() -> Void)?
    var onResult: (([String]) -> Void)?
    var onAutoFinishProgress: ((Double) -> Void)?
    var onError: ((String) -> Void)?
    var onPermissionDenied: (() -> Void)?
    var onVolumeChange: ((VolumeChangeEvent) -> Void)?
    
    init(locale: Locale) {
        self.locale = locale
    }
    
    func start() {
        if isActive {
            return
        }
        
        Permissions(
            onGranted: self.startSession,
            onDenied: self.onPermissionDenied,
            onError: self.onError
        ).requestAuthorization()
    }
    
    func stop() {
        guard isActive, !isStopping else { return }
        isStopping = true
        HapticImpact.trigger(with: config?.stopHapticFeedbackStyle)
    }
    
    func updateSession(
        newConfig: SpeechToTextParams? = nil,
        addMsToTimer: Double? = nil,
        resetTimer: Bool? = nil
    ) {
        guard isActive, !isStopping else { return }
        if let newTime = newConfig?.autoFinishRecognitionMs,
           newTime != config?.autoFinishRecognitionMs {
            autoStopper?.updateThreshold(
                newTime,
                from: "updateSession"
            )
        }
        if let newInterval = newConfig?.autoFinishProgressIntervalMs,
           newInterval != config?.autoFinishProgressIntervalMs {
            autoStopper?.updateProgressInterval(
                newInterval,
                from: "updateSession"
            )
        }
        if let addMsToTimer {
            // Adds time to timer for once
            autoStopper?.addMsOnce(
                addMsToTimer, 
                from: "updateSession"
            )
        } else if resetTimer == true {
            // Reset to current baseline threshold.
            autoStopper?.resetTimer(from: "updateSession")
        }
        if let newConfig {
            // Update config only if none-nil
            config = newConfig
        }
    }
    
    func startSession() async {
        lg.log("[startSession.startSession]")
        // Init everything
        isStopping = false
        isActive = true
        
        initAutoStop()
        lg.log("[startSession.initAutoStop]")
        startAppStateObserver()
        lg.log("[startSession.startAppStateObserver]")
        guard startAudioSession() else {
            cleanup(from: "startRecognitionSetup")
            return
        }
        lg.log("[startSession.startAudioSession]")
        // Extension in subclasses
    }
    
    func prewarm(for: FailureType) async -> Bool {
        // for SpeechTranscriber: .isAvailable and async assets
        // for Dictation: only async assets
        // for legacy SF: only sync .isAvailable
        return true
    }
    
    func startAudioEngine(
        onBuffer: @escaping (AVAudioPCMBuffer) -> Void
    ) {
        lg.log("[startAudioEngine]")
        audioEngine = AVAudioEngine()
        lg.log("[startAudioEngine.audioEngine]")
        guard let audioEngine else {
            self.reportFailure(
                from: "Audio Engine",
                message: "Audio Engine failed to initiate",
                // Recognizer-Engine agnostic Error
                type: .system
            )
            return
        }
        hardwareFormat = audioEngine.inputNode.outputFormat(forBus: 0)
        lg.log("[startAudioEngine.hardwareFormat]")
        audioEngine.inputNode.installTap(
            onBus: 0,
            bufferSize: 1024,
            format: hardwareFormat
        ) { [weak self] buffer, _ in
            guard let self else { return }
            if let sample = self.audioLevelTracker.process(buffer) {
                // Send buffer volume data
                self.onVolumeChange?(
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
                // Recognizer-Engine agnostic Error
                type: .system
            )
        }
    }
    
    func sendFeedbackOnStart() {
        lg.log("[sendFeedbackOnStart]")
        HapticImpact.trigger(with: config?.startHapticFeedbackStyle)
        autoStopper?.resetTimer(from: "startListening.sendFeedbackOnStart")
        self.onReady?()
        self.onResult?([])
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
        self.onVolumeChange?(
            VolumeChangeEvent(
                smoothedVolume: 0,
                rawVolume: 0,
                db: nil
            )
        )
        if wasActive {
            self.onStop?()
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
                self.reselectEngine?(isPrewarm)
            // System level issue: send onError with description and clean
            // Session has already started: send onError and cleanup
            case .system, .onSession:
                self.onError?(message)
        }
    }
    
    func trackPartialActivity() {
        if !self.isStopping {
            self.autoStopper?.resetTimer(from: "Partial results")
        }
    }
}

// AutoStopper extension
extension RecognizerEngine {
    private func initAutoStop() {
        autoStopper = AutoStopper(
            silenceThresholdMs: config?.autoFinishRecognitionMs,
            progressIntervalMs: config?.autoFinishProgressIntervalMs,
            onProgress: { [weak self] timeLeftMs in
                guard let self else { return }
                self.onAutoFinishProgress?(timeLeftMs)
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
}

// App State Observer extension
extension RecognizerEngine {
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
}

// Audio Session extension
extension RecognizerEngine {
    private func startAudioSession() -> Bool {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            // Required for haptic feedback
            try audioSession.setAllowHapticsAndSystemSoundsDuringRecording(true)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            return true
        } catch {
            self.reportFailure(
                from: "startAudioSession",
                message: "Failed to activate audio session: \(error.localizedDescription)",
                // Recognizer-Engine agnostic Error
                type: .system
            )
            return false
        }
    }
    private func stopAudioSession() {
        do {
            // !!todo: check unduck
            try AVAudioSession.sharedInstance().setActive(false)
        } catch {
            // Just log and no-op - not critical
            lg.log("Failed to deactivate audio session: \(error.localizedDescription)")
        }
    }
}
