import Foundation
import Speech

final class LocaleManager {
    private let sfSpeechLocales = SFSpeechRecognizer.supportedLocales().map { $0.identifier }
    private var speechLocales: [String]
    private var dictationLocales: [String]
    var supportedLocales: [String]
    var SFLocale: Locale?
    var speechLocale: Locale?
    var dictationLocale: Locale?
    
    private var equivalentsCountedFor: String?
    
    init() {
        self.speechLocales = []
        self.dictationLocales = []
        self.supportedLocales = sfSpeechLocales
        
        Task { [weak self] in
            guard #available(iOS 26.0, *), let self else { return }
            self.speechLocales = await SpeechTranscriber.supportedLocales.map {
                $0.identifier
            }
            self.dictationLocales = await DictationTranscriber.supportedLocales.map {
                $0.identifier
            }
            Log.log("[Coordinator] sfSpeechLocales: \(self.sfSpeechLocales)")
            Log.log("[Coordinator] speechLocales: \(self.speechLocales)")
            Log.log("[Coordinator] dictationLocales: \(self.dictationLocales)")
            self.supportedLocales = Array(
                Set(sfSpeechLocales)
                .union(Set(speechLocales))
                .union(Set(dictationLocales))
            )
        }
    }

    func ensureLocale(localeString: String?) async {
        let identifier = localeString ?? "en-US"
        if self.equivalentsCountedFor == identifier {
            // All locales has been counted already, might be nil, but use them
            Log.log("[Coordinator] ensureLocale: \(identifier) -> Already counted ")
        }
        if #available(iOS 26.0, *) {
            let speechEquivalent = await SpeechTranscriber.supportedLocale(
                equivalentTo: Locale(identifier: identifier)
            )?.identifier
            if let speechEquivalent, speechLocales.contains(speechEquivalent) {
                self.speechLocale = Locale(identifier: speechEquivalent)
            }
            
            let dictationEquivalent = await DictationTranscriber.supportedLocale(
                equivalentTo: Locale(identifier: identifier)
            )?.identifier
            if let dictationEquivalent, self.dictationLocales.contains(dictationEquivalent) {
                self.dictationLocale = Locale(identifier: dictationEquivalent)
            }
        }
        if sfSpeechLocales.contains(identifier) {
            self.SFLocale = Locale(identifier: identifier)
        }
        self.equivalentsCountedFor = identifier
        Log.log("[Coordinator] ensureLocale: \(identifier) -> New")
    }
}