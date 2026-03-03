import Foundation
import os.log

class AutoStopper {
    private let logger = Logger(subsystem: "com.margelo.nitro.nitrospeech", category: "AutoStopper")
    private let onTimeout: () -> Void
    private let onProgress: (Double) -> Void
    
    private var defaultSilenceThresholdMs: Double
    private var silenceThresholdMs: Double
    
    private var progressTask: Task<Void, Never>?
    private var elapsedMs: Double = 0
    private var isStopped = false
    
    init(silenceThresholdMs: Double, onProgress: @escaping (Double) -> Void, onTimeout: @escaping () -> Void) {
        self.defaultSilenceThresholdMs = silenceThresholdMs
        self.silenceThresholdMs = silenceThresholdMs
        self.onProgress = onProgress
        self.onTimeout = onTimeout
    }
    
    func indicateRecordingActivity(from: String, addMsToThreshold: Double?) {
        logger.info("[IndicateRecordingActivity]: \(from)")
        if let addMsToThreshold = addMsToThreshold {
            self.silenceThresholdMs = addMsToThreshold + self.silenceThresholdMs - self.elapsedMs
        } else {
            self.silenceThresholdMs = self.defaultSilenceThresholdMs
        }

        self.onProgress(self.silenceThresholdMs)
        progressTask?.cancel()
        self.elapsedMs = 0
        if isStopped { return }
        
        scheduleNextTick()
    }
    
    private func scheduleNextTick() {
        progressTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            guard let self = self, !self.isStopped, !Task.isCancelled else { return }
            
            self.elapsedMs += 1000
            let timeLeftMs = self.silenceThresholdMs - self.elapsedMs
            
            if timeLeftMs <= 0 {
                self.onTimeout()
            } else {
                self.onProgress(timeLeftMs)
                self.scheduleNextTick()
            }
        }
    }
    
    func updateSilenceThreshold(newThresholdMs: Double) {
        self.defaultSilenceThresholdMs = newThresholdMs
    }
    
    func stop() {
        isStopped = true
        progressTask?.cancel()
        progressTask = nil
    }
    
    deinit {
        stop()
    }
}
