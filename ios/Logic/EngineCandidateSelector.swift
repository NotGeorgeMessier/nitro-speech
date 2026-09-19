import Foundation

enum RecognizerBackend: Equatable {
    case speechTranscriber
    case dictationTranscriber
    case sfSpeech
}

enum EngineCandidateSelector {
    /// Dictation is preferred for short-form / speed presets, disabled punctuation, or atypical speech.
    static func prefersDictation(
        iosPreset: String?,
        addPunctuation: Bool?,
        atypicalSpeech: Bool?
    ) -> Bool {
        iosPreset == "shortform"
            || iosPreset == "speed"
            || addPunctuation == false
            || atypicalSpeech == true
    }

    static func candidates(
        ios26Available: Bool,
        preferDictation: Bool,
        hasSpeech: Bool,
        hasDictation: Bool,
        hasSF: Bool
    ) -> [RecognizerBackend] {
        if !ios26Available {
            return hasSF ? [.sfSpeech] : []
        }

        var result: [RecognizerBackend] = []
        if preferDictation {
            if hasDictation {
                result.append(.dictationTranscriber)
            }
            if hasSpeech {
                result.append(.speechTranscriber)
            }
        } else {
            if hasSpeech {
                result.append(.speechTranscriber)
            }
            if hasDictation {
                result.append(.dictationTranscriber)
            }
        }
        if hasSF {
            result.append(.sfSpeech)
        }
        return result
    }
}
