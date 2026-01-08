import Foundation
import os.log

class AutoStopper {
    private let silenceThreshold: TimeInterval
    private let onTimeout: () -> Void
    private var workItem: DispatchWorkItem?
    private var isStopped = false
    private let logger = Logger(subsystem: "com.margelo.nitro.nitrospeech", category: "AutoStopper")
    
    init(silenceThresholdMs: Double, onTimeout: @escaping () -> Void) {
        self.silenceThreshold = silenceThresholdMs / 1000.0
        self.onTimeout = onTimeout
    }
    
    func indicateRecordingActivity(from: String) {
        logger.info("indicateRecordingActivity: \(from)")
        workItem?.cancel()
        if isStopped { return }
        
        let item = DispatchWorkItem { [weak self] in
            guard let self = self, !self.isStopped else { return }
            self.onTimeout()
        }
        workItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + silenceThreshold, execute: item)
    }
    
    func stop() {
        isStopped = true
        workItem?.cancel()
        workItem = nil
    }
}

