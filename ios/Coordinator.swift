import Foundation
import NitroModules
import Speech

enum RecognizerBackend {
    case speechTranscriber
    case dictationTranscriber
    case sfSpeech
}

final class Coordinator {
    weak var recognizerDelegate: RecognizerDelegate?
    private var localeManager: LocaleManager?
    private var candidates: [RecognizerBackend] = []
    private var localeTask: Task<Void, Never>?
    
    init() {
        self.localeTask = Task {
            self.localeManager = await LocaleManager()
        }
    }
    
    func initialize() async {
        let params = self.recognizerDelegate?.config
        Log.log("[Coordinator] LocaleManager - init (\(params?.locale))")
        if self.localeManager == nil {
            self.localeTask?.cancel()
            self.localeTask = nil
            self.localeManager = await LocaleManager()
        }
        guard let localeManager else { return }
        await localeManager.ensureLocale(localeString: params?.locale)
        self.candidates = []
        guard #available(iOS 26.0, *) else {
            if localeManager.SFLocale != nil {
                self.candidates = [.sfSpeech]
            }
            return
        }
        
        if params?.iosPreset == IosPreset.shortform
        || params?.iosAddPunctuation == false
        || params?.iosAtypicalSpeech == true {
            // DictationTranscriber priority
            if localeManager.dictationLocale != nil {
                self.candidates.append(.dictationTranscriber)
            }
            if localeManager.speechLocale != nil {
                self.candidates.append(.speechTranscriber)
            }
        } else {
            // SpeechTranscriber priority
            if localeManager.speechLocale != nil {
                self.candidates.append(.speechTranscriber)
            }
            if localeManager.dictationLocale != nil {
                self.candidates.append(.dictationTranscriber)
            }
        }
        // Add SF Engine at the end
        if localeManager.SFLocale != nil {
            self.candidates.append(.sfSpeech)
        }
        Log.log("[Coordinator] candidates: \(self.candidates)")
    }
    
    func getEngine() -> RecognizerEngine? {
        Log.log("[Coordinator] getEngine")
        guard let recognizerDelegate else { return nil }
        guard let localeManager else { return nil }
        guard let backend = candidates.first else { return nil }
        Log.log("[Coordinator] backend: \(backend)")
        if backend == .sfSpeech, let locale = localeManager.SFLocale {
            Log.log("[Coordinator] SFSpeechEngine Activated")
            return SFSpeechEngine(locale: locale, delegate: recognizerDelegate)
        }
        if #available(iOS 26.0, *) {
            if backend == .speechTranscriber, let locale = localeManager.speechLocale {
                Log.log("[Coordinator] SpeechTranscriber Activated")
                return AnalyzerEngine(
                    backend: .speechTranscriber,
                    locale: locale,
                    delegate: recognizerDelegate
                )
            }
            if backend == .dictationTranscriber, let locale = localeManager.dictationLocale {
                Log.log("[Coordinator] DictationTranscriber Activated")
                return AnalyzerEngine(
                    backend: .dictationTranscriber,
                    locale: locale,
                    delegate: recognizerDelegate
                )
            }
        }
        return nil
    }
    
    func reportEngineFailure() {
        self.candidates = Array(self.candidates.dropFirst())
    }
    
    func getSupportedLocales() -> [String] {
        return localeManager?.supportedLocales ?? []
    }
}
