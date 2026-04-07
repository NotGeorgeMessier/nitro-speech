import Foundation
import UIKit

enum HapticImpact {
    static func trigger(with: HapticFeedbackStyle?) {
        // Default behavior - medium
        let style = with ?? HapticFeedbackStyle.medium
        let hapticStyle: UIImpactFeedbackGenerator.FeedbackStyle? = switch style {
            case .light:
                UIImpactFeedbackGenerator.FeedbackStyle.light
            case .medium:
                UIImpactFeedbackGenerator.FeedbackStyle.medium
            case .heavy:
                UIImpactFeedbackGenerator.FeedbackStyle.heavy
            case .none:
                nil
        }
        if let hapticStyle {
            let impactGenerator = UIImpactFeedbackGenerator(style: hapticStyle)
            impactGenerator.prepare()
            impactGenerator.impactOccurred()
        }
    }
}
