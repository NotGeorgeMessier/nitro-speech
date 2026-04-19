import Foundation
import NitroModules

class HybridRecognizer: HybridRecognizerSpec {
    var onReadyForSpeech: (() -> Void)?
    var onRecordingStopped: (() -> Void)?
    var onResult: (([String]) -> Void)?
    var onAutoFinishProgress: ((Double) -> Void)?
    var onError: ((String) -> Void)?
    var onPermissionDenied: (() -> Void)?
    var onVolumeChange: ((VolumeChangeEvent) -> Void)?
    
    private let localeManager = LocaleManager()
    private let coordinator: Coordinator
    private var config: SpeechToTextParams?
    private var paramsHash: String?
    private var engine: RecognizerEngine?
    
    override init() {
        self.coordinator = Coordinator(localeManager: self.localeManager)
        super.init()
    }
    
    func prewarm(defaultParams: SpeechToTextParams?) {
        Task {
            // Ensure correct engine is selected based on params and ios version
            guard let engine = await ensureEngine(params: defaultParams) else { return }
            // try to preload assets and check if speech engine is available on OS level
            guard await engine.prewarm(for: .prewarm) else { return }
        }
    }
    
    func startListening(params: SpeechToTextParams?) {
        Task {
            // Ensure correct engine is selected based on params and ios version
            guard let engine = await ensureEngine(params: params) else { return }
            engine.start()
        }
    }
    
    func stopListening() {
        engine?.stop()
    }
    
    func addAutoFinishTime(additionalTimeMs: Double?) {
        if let additionalTimeMs {
            engine?.updateSession(addMsToTimer: additionalTimeMs)
        } else {
            // Spec parity: if additionalTimeMs is omitted, reset timer to original baseline.
            engine?.updateSession(resetTimer: true)
        }
    }
    
    func updateAutoFinishTime(newTimeMs: Double, withRefresh: Bool?) {
        config = SpeechToTextParams(
            locale: config?.locale,
            // Only replace auto finish time
            autoFinishRecognitionMs: newTimeMs,
            autoFinishProgressIntervalMs: config?.autoFinishProgressIntervalMs,
            disableRepeatingFilter: config?.disableRepeatingFilter,
            contextualStrings: config?.contextualStrings,
            startHapticFeedbackStyle: config?.startHapticFeedbackStyle,
            stopHapticFeedbackStyle: config?.stopHapticFeedbackStyle,
            maskOffensiveWords: config?.maskOffensiveWords,
            androidFormattingPreferQuality: config?.androidFormattingPreferQuality,
            androidUseWebSearchModel: config?.androidUseWebSearchModel,
            androidDisableBatchHandling: config?.androidDisableBatchHandling,
            iosAddPunctuation: config?.iosAddPunctuation,
            iosPreset: config?.iosPreset,
            iosAtypicalSpeech: config?.iosAtypicalSpeech
        )
        engine?.updateSession(
            newConfig: config,
            resetTimer: withRefresh == true
        )
    }

    func getIsActive() -> Bool {
        engine?.isActive ?? false
    }
    
    func getSupportedLocalesIOS() -> [String] {
        return localeManager.supportedLocales
    }

    private func ensureEngine(params: SpeechToTextParams?) async -> RecognizerEngine? {
        // Remember new params
        config = params
        let hash = Utils.hashParams(params)
        if engine != nil && hash == paramsHash {
            Log.log("Reuse Engine")
            // Engine is already correct
            return engine
        }
        if hash != paramsHash {
            await localeManager.ensureLocale(localeString: params?.locale)
            // Initialize when trying to select new engine with new params
            coordinator.initialize(with: params)
            paramsHash = hash
        }
        Log.log("backend: \(coordinator.candidates.first) with: \(hash)")
        // Try to select new engine
        guard let backend = coordinator.candidates.first else {
            self.onError?("No recognition engine available for the requested locale")
            return nil
        }
        if backend == .sfSpeech, let locale = localeManager.SFLocale {
            engine = SFSpeechEngine(locale: locale)
        } else if #available(iOS 26.0, *) {
            if backend == .speechTranscriber, let locale = localeManager.speechLocale {
                engine = AnalyzerEngine(
                    backend: .speechTranscriber,
                    locale: locale
                )
            } else if let locale = localeManager.dictationLocale {
                engine = AnalyzerEngine(
                    backend: .dictationTranscriber,
                    locale: locale
                )
            }
        }
        engine?.config = params
        engine?.reselectEngine = reselectEngine
        engine?.onReady = { [weak self] in
            Log.log("[HR -> onReadyForSpeech]")
            self?.onReadyForSpeech?()
        }
        engine?.onStop = { [weak self] in
            Log.log("[HR -> onReadyForSpeech]")
            self?.onRecordingStopped?()
        }
        engine?.onResult = { [weak self] batches in
            Log.log("[HR -> onResult]")
            self?.onResult?(batches)
        }
        engine?.onAutoFinishProgress = { [weak self] ms in
            Log.log("[HR -> onAutoFinishProgress]")
            self?.onAutoFinishProgress?(ms)
        }
        engine?.onError = { [weak self] msg in
            Log.log("[HR -> onError]")
            self?.onError?(msg)
        }
        engine?.onPermissionDenied = { [weak self] in
            Log.log("[HR -> onPermissionDenied]")
            self?.onPermissionDenied?()
        }
        engine?.onVolumeChange = { [weak self] event in
            Log.log("[HR -> onVolumeChange] \(event.rawVolume)")
            self?.onVolumeChange?(event)
        }
        return engine
    }
    
    private func reselectEngine(forPrewarm: Bool) {
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
