import Foundation
import UIKit

enum HapticImpact {
    // Hardcode this numbers to conform Android interface
    static let LIGHT_INTENSITY: CGFloat = 0.2
    static let MEDIUM_INTENSITY: CGFloat = 0.5
    static let HEAVY_INTENSITY: CGFloat = 0.8
    
    static func trigger(with: HapticFeedbackStyle?) {
        // Default behavior - medium
        let style = with ?? HapticFeedbackStyle.medium
        let hapticIntesity: CGFloat? = switch style {
            case .light: LIGHT_INTENSITY
            case .medium: MEDIUM_INTENSITY
            case .heavy: HEAVY_INTENSITY
            case .none: nil
        }
        if let hapticIntesity {
            UIImpactFeedbackGenerator().impactOccurred(intensity: hapticIntesity)
        }
    }
}
