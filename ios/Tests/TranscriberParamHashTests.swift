import XCTest
@testable import NitroSpeechLogic

final class TranscriberParamHashTests: XCTestCase {
    func testMissingParamsSentinel() {
        XCTAssertEqual(TranscriberParamHash.hashMissingParams(), "n")
    }

    func testDefaultLocaleWhenNil() {
        XCTAssertEqual(
            TranscriberParamHash.hash(
                locale: nil,
                addPunctuation: nil,
                preset: nil,
                atypicalSpeech: nil
            ),
            "en-US|n|n|n"
        )
    }

    func testExplicitLocaleAndFlags() {
        XCTAssertEqual(
            TranscriberParamHash.hash(
                locale: "fr-FR",
                addPunctuation: true,
                preset: "general",
                atypicalSpeech: false
            ),
            "fr-FR|t|g|f"
        )
    }

    func testShortformAndSpeedShareDictationBucket() {
        let shortform = TranscriberParamHash.hash(
            locale: "en-US",
            addPunctuation: nil,
            preset: "shortform",
            atypicalSpeech: nil
        )
        let speed = TranscriberParamHash.hash(
            locale: "en-US",
            addPunctuation: nil,
            preset: "speed",
            atypicalSpeech: nil
        )
        XCTAssertEqual(shortform, "en-US|n|s|n")
        XCTAssertEqual(shortform, speed)
    }

    func testUnknownPresetIsNeutral() {
        XCTAssertEqual(
            TranscriberParamHash.hash(
                locale: "en-US",
                addPunctuation: false,
                preset: "other",
                atypicalSpeech: true
            ),
            "en-US|f|n|t"
        )
    }

    func testHashChangesWhenLocaleChanges() {
        let a = TranscriberParamHash.hash(
            locale: "en-US",
            addPunctuation: nil,
            preset: nil,
            atypicalSpeech: nil
        )
        let b = TranscriberParamHash.hash(
            locale: "de-DE",
            addPunctuation: nil,
            preset: nil,
            atypicalSpeech: nil
        )
        XCTAssertNotEqual(a, b)
    }
}
