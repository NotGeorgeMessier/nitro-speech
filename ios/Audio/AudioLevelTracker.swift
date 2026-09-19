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
    private var smoothedLevel: Float = 0

    var currentSample: AudioLevelSample?

    func reset() {
        smoothedLevel = 0
        currentSample = nil
    }

    func process(_ buffer: AVAudioPCMBuffer,_ autoStopResetThreshold: Double? = nil) -> AudioLevelSample? {
        guard let samples = buffer.floatChannelData?[0] else { return nil }

        let frameCount = Int(buffer.frameLength)
        var rms: Float = 0
        vDSP_rmsqv(samples, 1, &rms, vDSP_Length(frameCount))

        let db = VolumeMath.db(fromRms: rms)
        let normalized = VolumeMath.normalized(fromDb: db)
        smoothedLevel = VolumeMath.smooth(current: smoothedLevel, target: normalized)
        let threshold = VolumeMath.clampThreshold(autoStopResetThreshold)

        currentSample = AudioLevelSample(
            smoothed: VolumeMath.round6(smoothedLevel),
            raw: VolumeMath.round6(normalized),
            db: VolumeMath.roundDb(db),
            resetTimer: VolumeMath.shouldResetTimer(
                normalized: Double(normalized),
                threshold: threshold
            )
        )

        return currentSample
    }
}
