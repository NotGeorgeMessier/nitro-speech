import Foundation
import NitroModules

class HybridRecognizer: HybridRecognizerSpec  {
    var config: SpeechRecognitionConfig?
    
    var onReadyForSpeech: (() -> Void)?
    var onRecordingStopped: (() -> Void)?
    var onResult: (([String]) -> Void)?
    var onAutoFinishProgress: ((Double) -> Void)?
    var onError: ((String) -> Void)?
    var onPermissionDenied: (() -> Void)?
    var onVolumeChange: ((VolumeChangeEvent) -> Void)?
    
    private let coordinator = Coordinator()
    private var paramsHash: String?
    private var engine: RecognizerEngine?
    
    override init() {
        super.init()
        self.coordinator.recognizerDelegate = self
    }
    
    private let lg = Lg(prefix: "HybridRecognizer")
    
    @discardableResult
    func prewarm(defaultParams: SpeechRecognitionConfig?) -> Promise<Void> {
        return Promise.async(.userInitiated) { [weak self] in
            // Ensure correct engine is selected based on params and ios version
            await self?.ensureEngine(params: defaultParams)
            // try to preload assets and check if speech engine is available on OS level
            await self?.engine?.prewarm(for: .prewarm)
        }
    }
    
    func startListening(params: SpeechRecognitionConfig?) {
        Task {
            // Ensure correct engine is selected based on params and ios version
            await ensureEngine(params: params)
            engine?.start()
        }
    }
    
    func stopListening() {
        engine?.stop()
    }
    
    func resetAutoFinishTime() {
        engine?.updateSession(resetTimer: true)
    }
    
    func addAutoFinishTime(additionalTimeMs: Double?) {
        if let additionalTimeMs {
            engine?.updateSession(addMsToTimer: additionalTimeMs)
        } else {
            // Reset timer to original baseline.
            engine?.updateSession(resetTimer: true)
        }
    }
    
    func updateConfig(newConfig: MutableSpeechRecognitionConfig?, resetAutoFinishTime: Bool?) {
        engine?.updateSession(
            newConfig: newConfig,
            resetTimer: resetAutoFinishTime
        )
    }

    func getIsActive() -> Bool {
        engine?.isActive ?? false
    }
    
    func getSupportedLocalesIOS() -> [String] {
        return self.coordinator.getSupportedLocales()
    }

    private func ensureEngine(params: SpeechRecognitionConfig?) async {
        // Remember new params
        config = params
        let hash = Utils.hashParams(params)
        if engine != nil && hash == paramsHash {
            lg.log("Reuse Engine")
            // Engine is already correct
            return
        }
        if hash != paramsHash {
            // Initialize when trying to select new engine with new params
            await coordinator.initialize()
            paramsHash = hash
        }
        lg.log("hash: \(hash)")
        // Try to select new engine
        engine = coordinator.getEngine()
        if engine == nil {
            // Only wrong locale can wipe out all candidates
            self.onError?("No recognition engine available for the requested locale")
            return
        }
    }
}

protocol RecognizerDelegate: AnyObject {
    var config: SpeechRecognitionConfig? { get }
    func softlyUpdateConfig(newConfig: MutableSpeechRecognitionConfig?)
    func reselectEngine(forPrewarm: Bool)
    func readyForSpeech()
    func recordingStopped()
    func result (batches: [String])
    func autoFinishProgress (timeLeftMs: Double)
    func error (message: String)
    func permissionDenied ()
    func volumeChange (event: VolumeChangeEvent)
}

extension HybridRecognizer: RecognizerDelegate {
    func softlyUpdateConfig(newConfig: MutableSpeechRecognitionConfig?) {
        if let newConfig {
            config = SpeechRecognitionConfig(
                locale: config?.locale,
                contextualStrings: config?.contextualStrings,
                maskOffensiveWords: config?.maskOffensiveWords,
                autoFinishRecognitionMs: newConfig.autoFinishRecognitionMs ?? config?.autoFinishRecognitionMs,
                autoFinishProgressIntervalMs: newConfig.autoFinishProgressIntervalMs ?? config?.autoFinishProgressIntervalMs,
                resetAutoFinishVoiceSensitivity: newConfig.resetAutoFinishVoiceSensitivity ?? config?.resetAutoFinishVoiceSensitivity,
                disableRepeatingFilter: newConfig.disableRepeatingFilter ?? config?.disableRepeatingFilter,
                startHapticFeedbackStyle: newConfig.startHapticFeedbackStyle ?? config?.startHapticFeedbackStyle,
                stopHapticFeedbackStyle: newConfig.stopHapticFeedbackStyle ?? config?.stopHapticFeedbackStyle,
                androidFormattingPreferQuality: config?.androidFormattingPreferQuality,
                androidUseWebSearchModel: config?.androidUseWebSearchModel,
                androidDisableBatchHandling: config?.androidDisableBatchHandling,
                iosAddPunctuation: config?.iosAddPunctuation,
                iosPreset: config?.iosPreset,
                iosAtypicalSpeech: config?.iosAtypicalSpeech
            )
        }
    }
    
    func readyForSpeech() {
        self.lg.log("[HR -> onReadyForSpeech]")
        self.onReadyForSpeech?()
    }
    
    func recordingStopped() {
        self.lg.log("[onRecordingStopped]")
        self.onRecordingStopped?()
    }
    
    func result(batches: [String]) {
        self.lg.log("[onResult] \(batches)")
        self.onResult?(batches)
    }
    
    func autoFinishProgress(timeLeftMs: Double) {
        self.lg.log("[onAutoFinishProgress] \(timeLeftMs)ms")
        self.onAutoFinishProgress?(timeLeftMs)
    }
    
    func error(message: String) {
        self.lg.log("[onError]")
        self.onError?(message)
    }
    
    func permissionDenied() {
        self.lg.log("[onPermissionDenied]")
        self.onPermissionDenied?()
    }
    
    func volumeChange(event: VolumeChangeEvent) {
        // self.lg.log("[onVolumeChange] \(event.rawVolume)")
        self.onVolumeChange?(event)
    }
    
    func reselectEngine(forPrewarm: Bool) {
        // Remove failed engine from candidates
        coordinator.reportEngineFailure()
        // Reset active engine
        engine = nil
        // Try to prewarm with another candidate
        if forPrewarm {
            self.prewarm(defaultParams: config)
        } else {
            // Try to start with another candidate
            self.startListening(params: config)
        }
    }
}
