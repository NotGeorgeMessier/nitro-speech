import Foundation
import UIKit

class HapticImpact {
    private let impactGenerator: UIImpactFeedbackGenerator

    init(style: HapticFeedbackStyle) {
        let hapticStyle = switch style {
            case .light:
                UIImpactFeedbackGenerator.FeedbackStyle.light
            case .medium:
                UIImpactFeedbackGenerator.FeedbackStyle.medium
            case .heavy:
                UIImpactFeedbackGenerator.FeedbackStyle.heavy
        }
        self.impactGenerator = UIImpactFeedbackGenerator(style: hapticStyle)
    }

    func trigger() {
        impactGenerator.prepare()
        impactGenerator.impactOccurred()
    }
}
