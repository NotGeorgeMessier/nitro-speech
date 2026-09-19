import XCTest
@testable import NitroSpeechLogic

final class EngineCandidateSelectorTests: XCTestCase {
    func testPreIOS26OnlyUsesSFSpeech() {
        XCTAssertEqual(
            EngineCandidateSelector.candidates(
                ios26Available: false,
                preferDictation: true,
                hasSpeech: true,
                hasDictation: true,
                hasSF: true
            ),
            [.sfSpeech]
        )
        XCTAssertEqual(
            EngineCandidateSelector.candidates(
                ios26Available: false,
                preferDictation: false,
                hasSpeech: true,
                hasDictation: true,
                hasSF: false
            ),
            []
        )
    }

    func testSpeechPriorityOrder() {
        XCTAssertEqual(
            EngineCandidateSelector.candidates(
                ios26Available: true,
                preferDictation: false,
                hasSpeech: true,
                hasDictation: true,
                hasSF: true
            ),
            [.speechTranscriber, .dictationTranscriber, .sfSpeech]
        )
    }

    func testDictationPriorityOrder() {
        XCTAssertEqual(
            EngineCandidateSelector.candidates(
                ios26Available: true,
                preferDictation: true,
                hasSpeech: true,
                hasDictation: true,
                hasSF: true
            ),
            [.dictationTranscriber, .speechTranscriber, .sfSpeech]
        )
    }

    func testSkipsMissingBackends() {
        XCTAssertEqual(
            EngineCandidateSelector.candidates(
                ios26Available: true,
                preferDictation: false,
                hasSpeech: false,
                hasDictation: true,
                hasSF: false
            ),
            [.dictationTranscriber]
        )
    }

    func testPrefersDictationFromShortformOrSpeed() {
        XCTAssertTrue(
            EngineCandidateSelector.prefersDictation(
                iosPreset: "shortform",
                addPunctuation: nil,
                atypicalSpeech: nil
            )
        )
        XCTAssertTrue(
            EngineCandidateSelector.prefersDictation(
                iosPreset: "speed",
                addPunctuation: nil,
                atypicalSpeech: nil
            )
        )
        XCTAssertFalse(
            EngineCandidateSelector.prefersDictation(
                iosPreset: "general",
                addPunctuation: nil,
                atypicalSpeech: nil
            )
        )
    }

    func testPrefersDictationFromPunctuationOffOrAtypicalSpeech() {
        XCTAssertTrue(
            EngineCandidateSelector.prefersDictation(
                iosPreset: "general",
                addPunctuation: false,
                atypicalSpeech: nil
            )
        )
        XCTAssertTrue(
            EngineCandidateSelector.prefersDictation(
                iosPreset: nil,
                addPunctuation: nil,
                atypicalSpeech: true
            )
        )
        XCTAssertFalse(
            EngineCandidateSelector.prefersDictation(
                iosPreset: nil,
                addPunctuation: true,
                atypicalSpeech: false
            )
        )
    }
}
