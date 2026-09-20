import XCTest
@testable import NitroSpeechLogic

final class ErrorTraceTests: XCTestCase {
    func testJoinsDotSeparatedSegments() {
        XCTAssertEqual(
            ErrorTrace.join("HybridRecognizer", "ensureEngine"),
            "HybridRecognizer.ensureEngine"
        )
        XCTAssertEqual(
            ErrorTrace.join("OnDeviceSupport", "prepare", "downloadModel"),
            "OnDeviceSupport.prepare.downloadModel"
        )
    }

    func testDropsEmptySegments() {
        XCTAssertEqual(ErrorTrace.join("RecognizerEngine", "", "startAudioEngine"), "RecognizerEngine.startAudioEngine")
        XCTAssertEqual(ErrorTrace.join(""), "")
    }
}
