import Foundation
import UIKit

class HapticImpact {
    private let impactGenerator: UIImpactFeedbackGenerator?

    init(style: HapticFeedbackStyle) {
        if style == HapticFeedbackStyle.none {
            self.impactGenerator = nil
            return
        }
        let hapticStyle = switch style {
            case .light:
                UIImpactFeedbackGenerator.FeedbackStyle.light
            case .medium:
                UIImpactFeedbackGenerator.FeedbackStyle.medium
            case .heavy:
                UIImpactFeedbackGenerator.FeedbackStyle.heavy
            // Unreachable
            case .none:
                UIImpactFeedbackGenerator.FeedbackStyle.medium
        }
        self.impactGenerator = UIImpactFeedbackGenerator(style: hapticStyle)
    }

    func trigger() {
        if let impactGenerator {
            impactGenerator.prepare()
            impactGenerator.impactOccurred()
        }
    }
}
