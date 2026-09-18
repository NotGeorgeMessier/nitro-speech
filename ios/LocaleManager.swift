import Foundation
import Speech

final class LocaleManager {
    private let sfSpeechLocales = SFSpeechRecognizer.supportedLocales().map { $0.identifier }
    private var speechLocales: [String]
    private var dictationLocales: [String]
    var supportedLocales: [String]
    /// Locales that are ready without an AssetInventory download (SFSpeechRecognizer packs).
    var installedLocales: [String] { sfSpeechLocales }
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

    // Counting locale equivalents for each engine
    func ensureLocale(localeString: String?) async {
        let identifier = localeString ?? "en-US"
        if self.equivalentsCountedFor == identifier {
            // All locales has been counted already, might be nil, but use them
            Log.log("[Coordinator] ensureLocale: \(identifier) -> Already counted ")
            return
        }
        if #available(iOS 26.0, *) {
            self.speechLocale = await speechEquivalent(identifier)
            self.dictationLocale = await dictationEquivalent(identifier)
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
    
    @available(iOS 26.0, *)
    func speechEquivalent(_ identifier: String) async -> Locale? {
        let speechEquivalent = await SpeechTranscriber.supportedLocale(
            equivalentTo: Locale(identifier: identifier)
        )?.identifier
        if let speechEquivalent, speechLocales.contains(speechEquivalent) {
            return Locale(identifier: speechEquivalent)
        }
        return nil
    }
    
    @available(iOS 26.0, *)
    func dictationEquivalent(_ identifier: String) async -> Locale? {
        let dictationEquivalent = await DictationTranscriber.supportedLocale(
            equivalentTo: Locale(identifier: identifier)
        )?.identifier
        if let dictationEquivalent, self.dictationLocales.contains(dictationEquivalent) {
            return Locale(identifier: dictationEquivalent)
        }
        return nil
    }
}
