import Foundation
import AVFoundation
import Accelerate

struct AudioLevelSample {
    let smoothed: Double
    let raw: Double
    let db: Double
    let resetTimer: Bool
}

final class AudioLevelTracker {
    private static let meterMinDb: Float = -70
    private static let meterMaxDb: Float = -10
    private static let meterAttack: Float = 0.35
    private static let meterRelease: Float = 0.08
    private static let autoStopResetThreshold: Float = 0.6

    private var smoothedLevel: Float = 0

    func reset() {
        smoothedLevel = 0
    }

    func process(_ buffer: AVAudioPCMBuffer) -> AudioLevelSample? {
        guard let samples = buffer.floatChannelData?[0] else { return nil }

        let frameCount = Int(buffer.frameLength)
        var rms: Float = 0
        vDSP_rmsqv(samples, 1, &rms, vDSP_Length(frameCount))

        let db = 20 * log10(rms + 0.00001)
        let raw = (db - Self.meterMinDb) / (Self.meterMaxDb - Self.meterMinDb)
        let normalized = max(0, min(1, raw))

        let coeff = normalized > smoothedLevel ? Self.meterAttack : Self.meterRelease
        smoothedLevel += coeff * (normalized - smoothedLevel)
        let nowMs = ProcessInfo.processInfo.systemUptime * 1000

//        Log.log("👀now: \(nowMs), raw: \(normalized), db: \(db), smooth: \(smoothedLevel)")
        
        return AudioLevelSample(
            smoothed: Double(smoothedLevel * 1_000_000).rounded() / 1_000_000,
            raw: Double(normalized * 1_000_000).rounded() / 1_000_000,
            db: Double(db * 1_000).rounded() / 1_000,
            resetTimer: normalized >= Self.autoStopResetThreshold
        )
    }
}
