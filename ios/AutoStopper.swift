import Foundation
import os.log

class AutoStopper {
    private let logger = Logger(subsystem: "com.margelo.nitro.nitrospeech", category: "AutoStopper")
    private let onTimeout: () -> Void
    private let onProgress: (Double) -> Void
    
    private var defaultSilenceThresholdMs: Double
    private var silenceThresholdMs: Double
    
    private var progressWorkItem: DispatchWorkItem?
    private var elapsedMs: Double = 0
    private var isStopped = false
    
    init(silenceThresholdMs: Double, onProgress: @escaping (Double) -> Void, onTimeout: @escaping () -> Void) {
        self.defaultSilenceThresholdMs = silenceThresholdMs
        self.silenceThresholdMs = silenceThresholdMs
        self.onProgress = onProgress
        self.onTimeout = onTimeout
    }
    
    func indicateRecordingActivity(from: String, addMsToThreshold: Double?) {
        logger.info("indicateRecordingActivity: \(from)")
        if let addMsToThreshold = addMsToThreshold {
            self.silenceThresholdMs = addMsToThreshold + self.silenceThresholdMs - self.elapsedMs
        } else {
            self.silenceThresholdMs = self.defaultSilenceThresholdMs
        }

        self.onProgress(self.silenceThresholdMs)
        progressWorkItem?.cancel()
        self.elapsedMs = 0
        if isStopped { return }
        
        scheduleNextTick()
    }
    
    private func scheduleNextTick() {
        let item = DispatchWorkItem { [weak self] in
            guard let self = self, !self.isStopped else { return }
            
            self.elapsedMs += 1000
            let timeLeftMs = silenceThresholdMs - elapsedMs
            
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
    
    func updateSilenceThreshold(newThresholdMs: Double) {
        self.defaultSilenceThresholdMs = newThresholdMs
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
