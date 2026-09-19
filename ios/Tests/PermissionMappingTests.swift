import XCTest
@testable import NitroSpeechLogic

final class PermissionMappingTests: XCTestCase {
    func testSpeechAuthorizationRawValues() {
        XCTAssertEqual(PermissionMapping.fromSpeechAuthorizationRawValue(0), .notRequested)
        XCTAssertEqual(PermissionMapping.fromSpeechAuthorizationRawValue(1), .denied)
        XCTAssertEqual(PermissionMapping.fromSpeechAuthorizationRawValue(2), .denied)
        XCTAssertEqual(PermissionMapping.fromSpeechAuthorizationRawValue(3), .granted)
        XCTAssertEqual(PermissionMapping.fromSpeechAuthorizationRawValue(99), .notRequested)
    }

    func testAudioApplicationRecordPermissionRawValues() {
        XCTAssertEqual(PermissionMapping.fromAudioApplicationRecordPermissionRawValue(0), .notRequested)
        XCTAssertEqual(PermissionMapping.fromAudioApplicationRecordPermissionRawValue(1), .denied)
        XCTAssertEqual(PermissionMapping.fromAudioApplicationRecordPermissionRawValue(2), .granted)
        XCTAssertEqual(PermissionMapping.fromAudioApplicationRecordPermissionRawValue(-1), .notRequested)
    }

    func testAudioSessionFourCharCodes() {
        XCTAssertEqual(
            PermissionMapping.fromAudioSessionRecordPermissionRawValue(
                PermissionMapping.audioSessionUndetermined
            ),
            .notRequested
        )
        XCTAssertEqual(
            PermissionMapping.fromAudioSessionRecordPermissionRawValue(
                PermissionMapping.audioSessionDenied
            ),
            .denied
        )
        XCTAssertEqual(
            PermissionMapping.fromAudioSessionRecordPermissionRawValue(
                PermissionMapping.audioSessionGranted
            ),
            .granted
        )
    }

    func testNumericBridgeMatchesJSPermissionStatus() {
        XCTAssertEqual(PermissionMapping.Status.granted.rawValue, 0)
        XCTAssertEqual(PermissionMapping.Status.denied.rawValue, 1)
        XCTAssertEqual(PermissionMapping.Status.notRequested.rawValue, 2)
    }

    func testCombineSpeechDeniedWins() {
        XCTAssertEqual(
            PermissionMapping.combine(speech: .denied, microphone: .granted),
            .denied
        )
        XCTAssertEqual(
            PermissionMapping.combine(speech: .denied, microphone: .notRequested),
            .denied
        )
    }

    func testCombineSpeechNotRequestedShortCircuitsBeforeMicDenied() {
        XCTAssertEqual(
            PermissionMapping.combine(speech: .notRequested, microphone: .denied),
            .notRequested
        )
    }

    func testCombineGrantedRequiresBoth() {
        XCTAssertEqual(
            PermissionMapping.combine(speech: .granted, microphone: .granted),
            .granted
        )
        XCTAssertEqual(
            PermissionMapping.combine(speech: .granted, microphone: .denied),
            .denied
        )
        XCTAssertEqual(
            PermissionMapping.combine(speech: .granted, microphone: .notRequested),
            .notRequested
        )
    }
}
