import Foundation
import Speech

enum RecognizerBackend {
    case speechTranscriber
    case dictationTranscriber
    case sfSpeech
}

final class Coordinator {
    private let localeManager: LocaleManager
    var candidates: [RecognizerBackend] = []
    
    init(localeManager: LocaleManager) {
        self.localeManager = localeManager
    }
    
    func initialize(with params: SpeechToTextParams?) {
        Log.log("[Coordinator] init")
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
    
    func reportEngineFailure() {
        self.candidates = Array(self.candidates.dropFirst())
    }
}
