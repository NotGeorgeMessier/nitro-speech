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
    
    init() async {
        self.speechLocales = []
        self.dictationLocales = []
        self.supportedLocales = sfSpeechLocales
        
        if #available(iOS 26.0, *) {
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
            return
        }
        if #available(iOS 26.0, *) {
            let speechEquivalent = await SpeechTranscriber.supportedLocale(
                equivalentTo: Locale(identifier: identifier)
            )?.identifier
            if let speechEquivalent, speechLocales.contains(speechEquivalent) {
                self.speechLocale = Locale(identifier: speechEquivalent)
            } else {
                self.speechLocale = nil
            }
            
            let dictationEquivalent = await DictationTranscriber.supportedLocale(
                equivalentTo: Locale(identifier: identifier)
            )?.identifier
            if let dictationEquivalent, self.dictationLocales.contains(dictationEquivalent) {
                self.dictationLocale = Locale(identifier: dictationEquivalent)
            } else {
                self.dictationLocale = nil
            }
        }
        if sfSpeechLocales.contains(identifier) {
            self.SFLocale = Locale(identifier: identifier)
        } else {
            self.SFLocale = nil
        }
        self.equivalentsCountedFor = identifier
        Log.log("[Coordinator] equivalents: speechLocale: \(self.speechLocale?.identifier), dictationLocale: \(self.dictationLocale?.identifier), SFLocale: \(self.SFLocale?.identifier)")
        Log.log("[Coordinator] ensureLocale: \(identifier) -> New")
    }
}
