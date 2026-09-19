import Foundation

enum Utils {
    static func repeatingFilter(_ text: String) -> String {
        RepeatingFilter.apply(text)
    }

    // hash only params that affect transcriber preference
    static func hashParams(_ params: SpeechRecognitionConfig?) -> String {
        guard let params else { return TranscriberParamHash.hashMissingParams() }
        return TranscriberParamHash.hash(
            locale: params.locale,
            addPunctuation: params.iosAddPunctuation,
            preset: params.iosPreset?.stringValue,
            atypicalSpeech: params.iosAtypicalSpeech
        )
    }
    
    static func nowMs() -> Int {
        return Int(round(Double(DispatchTime.now().uptimeNanoseconds / 1_000_000)))
    }
}
