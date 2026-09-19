import Foundation

enum TranscriberParamHash {
    /// Stable hash of the iOS transcriber-preference inputs (not a full config dump).
    static func hash(
        locale: String?,
        addPunctuation: Bool?,
        preset: String?,
        atypicalSpeech: Bool?
    ) -> String {
        let localePart = locale ?? "en-US"
        let addPunctuationPart: String
        switch addPunctuation {
        case nil: addPunctuationPart = "n"
        case false: addPunctuationPart = "f"
        case true: addPunctuationPart = "t"
        }
        let presetPart: String
        switch preset {
        case nil: presetPart = "n"
        case "shortform", "speed": presetPart = "s"
        case "general": presetPart = "g"
        default: presetPart = "n"
        }
        let atypicalPart: String
        switch atypicalSpeech {
        case nil: atypicalPart = "n"
        case false: atypicalPart = "f"
        case true: atypicalPart = "t"
        }
        return [localePart, addPunctuationPart, presetPart, atypicalPart].joined(separator: "|")
    }

    static func hashMissingParams() -> String {
        "n"
    }
}
