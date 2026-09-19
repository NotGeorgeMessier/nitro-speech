import AVFoundation
import XCTest
@testable import NitroSpeechLogic

final class AudioLevelTrackerTests: XCTestCase {
    func testResetClearsSample() {
        let tracker = AudioLevelTracker()
        XCTAssertNil(tracker.currentSample)
        _ = tracker.process(makeBuffer(amplitude: 0.2))
        XCTAssertNotNil(tracker.currentSample)
        tracker.reset()
        XCTAssertNil(tracker.currentSample)
    }

    func testSilentBufferDoesNotResetTimerAtDefaultThreshold() {
        let tracker = AudioLevelTracker()
        let sample = tracker.process(makeBuffer(amplitude: 0), 0.4)
        XCTAssertNotNil(sample)
        XCTAssertEqual(sample!.raw, 0, accuracy: 0.001)
        XCTAssertFalse(sample!.resetTimer)
    }

    func testLoudBufferCanResetTimer() {
        let tracker = AudioLevelTracker()
        let sample = tracker.process(makeBuffer(amplitude: 1), 0.4)
        XCTAssertNotNil(sample)
        XCTAssertGreaterThan(sample!.raw, 0.9)
        XCTAssertTrue(sample!.resetTimer)
        XCTAssertGreaterThan(sample!.smoothed, 0)
    }

    func testThresholdOfOneDisablesReset() {
        let tracker = AudioLevelTracker()
        let sample = tracker.process(makeBuffer(amplitude: 1), 1)
        XCTAssertNotNil(sample)
        XCTAssertFalse(sample!.resetTimer)
    }

    func testSmoothedLevelRisesAcrossBuffers() {
        let tracker = AudioLevelTracker()
        let first = tracker.process(makeBuffer(amplitude: 1), 0.4)!
        let second = tracker.process(makeBuffer(amplitude: 1), 0.4)!
        XCTAssertGreaterThan(second.smoothed, first.smoothed)
    }

    private func makeBuffer(amplitude: Float, frames: AVAudioFrameCount = 1024) -> AVAudioPCMBuffer {
        let format = AVAudioFormat(standardFormatWithSampleRate: 16_000, channels: 1)!
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames)!
        buffer.frameLength = frames
        let samples = buffer.floatChannelData![0]
        for i in 0..<Int(frames) {
            samples[i] = amplitude
        }
        return buffer
    }
}
