import XCTest
@testable import NitroSpeechLogic

final class AutoStopperTests: XCTestCase {
    func testClampMs() {
        XCTAssertEqual(AutoStopper.clampMs(0), AutoStopper.minProgressIntervalMs)
        XCTAssertEqual(AutoStopper.clampMs(-10), AutoStopper.minProgressIntervalMs)
        XCTAssertEqual(AutoStopper.clampMs(.nan), AutoStopper.minProgressIntervalMs)
        XCTAssertEqual(AutoStopper.clampMs(.infinity), AutoStopper.minProgressIntervalMs)
        XCTAssertEqual(AutoStopper.clampMs(250), 250)
    }

    func testResetEmitsInitialProgressThenTimeout() {
        let progress = expectation(description: "progress")
        progress.assertForOverFulfill = false
        let timeout = expectation(description: "timeout")
        var lastProgress: Double = -1

        let stopper = AutoStopper(
            silenceThresholdMs: 120,
            progressIntervalMs: 50,
            onProgress: { value in
                lastProgress = value
                progress.fulfill()
            },
            onTimeout: {
                timeout.fulfill()
            }
        )

        stopper.resetTimer(from: "test")
        wait(for: [progress, timeout], timeout: 1.5)
        XCTAssertGreaterThan(lastProgress, 0)
        XCTAssertLessThan(lastProgress, 120)
        stopper.stop()
    }

    func testStopPreventsTimeout() {
        let timeout = expectation(description: "timeout should not fire")
        timeout.isInverted = true

        let stopper = AutoStopper(
            silenceThresholdMs: 200,
            progressIntervalMs: 50,
            onProgress: { _ in },
            onTimeout: {
                timeout.fulfill()
            }
        )
        stopper.resetTimer(from: "test")
        stopper.stop()
        wait(for: [timeout], timeout: 0.4)
    }

    func testAddMsOnceExtendsSession() {
        let timeout = expectation(description: "timeout")
        var progressValues: [Double] = []
        let lock = NSLock()

        let stopper = AutoStopper(
            silenceThresholdMs: 80,
            progressIntervalMs: 50,
            onProgress: { value in
                lock.lock()
                progressValues.append(value)
                lock.unlock()
            },
            onTimeout: {
                timeout.fulfill()
            }
        )
        stopper.resetTimer(from: "test")
        stopper.addMsOnce(400, from: "test")
        wait(for: [timeout], timeout: 2.0)
        lock.lock()
        let maxProgress = progressValues.max() ?? 0
        lock.unlock()
        XCTAssertGreaterThan(maxProgress, 80)
        stopper.stop()
    }

    func testUpdateThresholdDoesNotImmediatelyChangeTimeLeft() {
        let firstProgress = expectation(description: "first progress")
        var values: [Double] = []
        let stopper = AutoStopper(
            silenceThresholdMs: 500,
            progressIntervalMs: 10_000,
            onProgress: { value in
                values.append(value)
                firstProgress.fulfill()
            },
            onTimeout: {}
        )
        stopper.resetTimer(from: "test")
        wait(for: [firstProgress], timeout: 1.0)
        XCTAssertEqual(values.first ?? 0, 500, accuracy: 0.001)
        stopper.updateThreshold(80, from: "test")
        stopper.stop()
    }
}
