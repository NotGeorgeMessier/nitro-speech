import XCTest
@testable import NitroSpeechLogic

final class VolumeMathTests: XCTestCase {
    func testSilenceRmsNormalizesToZero() {
        let db = VolumeMath.db(fromRms: 0)
        let normalized = VolumeMath.normalized(fromDb: db)
        XCTAssertEqual(normalized, 0, accuracy: 0.0001)
        XCTAssertLessThan(db, VolumeMath.meterMinDb)
    }

    func testFullScaleRmsNormalizesToOne() {
        let db = VolumeMath.db(fromRms: 1)
        let normalized = VolumeMath.normalized(fromDb: db)
        XCTAssertEqual(normalized, 1, accuracy: 0.01)
        XCTAssertEqual(db, 0, accuracy: 0.01)
    }

    func testAttackIsFasterThanRelease() {
        let up = VolumeMath.smooth(current: 0, target: 1)
        let down = VolumeMath.smooth(current: 1, target: 0)
        XCTAssertEqual(up, VolumeMath.meterAttack, accuracy: 0.0001)
        XCTAssertEqual(down, 1 - VolumeMath.meterRelease, accuracy: 0.0001)
        XCTAssertGreaterThan(up, 1 - down)
    }

    func testClampThreshold() {
        XCTAssertEqual(VolumeMath.clampThreshold(nil), 0.4)
        XCTAssertEqual(VolumeMath.clampThreshold(-1), 0)
        XCTAssertEqual(VolumeMath.clampThreshold(2), 1)
        XCTAssertEqual(VolumeMath.clampThreshold(0.6), 0.6)
    }

    func testShouldResetTimer() {
        XCTAssertTrue(VolumeMath.shouldResetTimer(normalized: 0.4, threshold: 0.4))
        XCTAssertFalse(VolumeMath.shouldResetTimer(normalized: 0.39, threshold: 0.4))
        XCTAssertFalse(VolumeMath.shouldResetTimer(normalized: 1, threshold: 1))
    }

    func testRounding() {
        XCTAssertEqual(VolumeMath.round6(0.1234567), 0.123457, accuracy: 0.0000005)
        XCTAssertEqual(VolumeMath.roundDb(-12.3456), -12.346, accuracy: 0.0005)
    }
}
