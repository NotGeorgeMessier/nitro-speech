import Foundation

enum VolumeMath {
    static let meterMinDb: Float = -70
    static let meterMaxDb: Float = 0
    static let meterAttack: Float = 0.35
    static let meterRelease: Float = 0.08
    static let defaultAutoStopResetThreshold: Double = 0.4

    static func db(fromRms rms: Float) -> Float {
        20 * log10(rms + 0.00001)
    }

    static func normalized(fromDb db: Float) -> Float {
        let raw = (db - meterMinDb) / (meterMaxDb - meterMinDb)
        return max(0, min(1, raw))
    }

    static func smooth(current: Float, target: Float) -> Float {
        let coeff = target > current ? meterAttack : meterRelease
        return current + coeff * (target - current)
    }

    static func clampThreshold(_ value: Double?) -> Double {
        guard let value else { return defaultAutoStopResetThreshold }
        return max(0, min(1, value))
    }

    static func shouldResetTimer(normalized: Double, threshold: Double) -> Bool {
        threshold < 1 && normalized >= threshold
    }

    static func round6(_ value: Float) -> Double {
        Double(value * 1_000_000).rounded() / 1_000_000
    }

    static func roundDb(_ value: Float) -> Double {
        Double(value * 1_000).rounded() / 1_000
    }
}
