import Foundation
import UIKit

class AppStateObserver {
    private var observer: NSObjectProtocol?
    private let onResignActive: () -> Void
    
    init(onResignActive: @escaping () -> Void) {
        self.onResignActive = onResignActive
        
        observer = NotificationCenter.default.addObserver(
            forName: UIApplication.willResignActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.onResignActive()
        }
    }
    
    func stop() {
        if let observer = observer {
            NotificationCenter.default.removeObserver(observer)
            self.observer = nil
        }
    }
    
    deinit {
        stop()
    }
}

