import Foundation
import os.log

class AutoStopper {
    private let silenceThresholdMs: Double
    private let onTimeout: () -> Void
    private let onProgress: (Double) -> Void
    private var progressWorkItem: DispatchWorkItem?
    private var elapsedSeconds: Int = 0
    private var isStopped = false
    private let logger = Logger(subsystem: "com.margelo.nitro.nitrospeech", category: "AutoStopper")
    
    init(silenceThresholdMs: Double, onProgress: @escaping (Double) -> Void, onTimeout: @escaping () -> Void) {
        self.silenceThresholdMs = silenceThresholdMs
        self.onProgress = onProgress
        self.onTimeout = onTimeout
    }
    
    func indicateRecordingActivity(from: String) {
        logger.info("indicateRecordingActivity: \(from)")
        self.onProgress(self.silenceThresholdMs)
        progressWorkItem?.cancel()
        elapsedSeconds = 0
        if isStopped { return }
        
        scheduleNextTick()
    }
    
    private func scheduleNextTick() {
        let item = DispatchWorkItem { [weak self] in
            guard let self = self, !self.isStopped else { return }
            
            self.elapsedSeconds += 1
            let elapsedMs = Double(self.elapsedSeconds) * 1000
            let timeLeftMs = self.silenceThresholdMs - elapsedMs
            
            if timeLeftMs <= 0 {
                self.onTimeout()
            } else {
                self.onProgress(timeLeftMs)
                self.scheduleNextTick()
            }
        }
        progressWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0, execute: item)
    }
    
    func stop() {
        isStopped = true
        progressWorkItem?.cancel()
        progressWorkItem = nil
    }
    
    deinit {
        stop()
    }
}
