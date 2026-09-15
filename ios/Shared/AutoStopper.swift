import Foundation

final class AutoStopper {
    private static let defaultSilenceThresholdMs = 8000.0
    private static let defaultProgressIntervalMs = 1000.0
    private static let minProgressIntervalMs = 50.0

    private let lg = Lg(prefix: "AutoStopper", disable: true)
    
    private let queue = DispatchQueue(label: "com.margelo.nitrospeech.autostopper")

    private var silenceThresholdMs: Double
    private var progressIntervalMs: Double
    private var timeLeftMs: Double
    private var isStopped = false
    private var didTimeout = false
    private var timer: DispatchSourceTimer?

    private let onProgress: (Double) -> Void
    private let onTimeout: () -> Void

    init(
        silenceThresholdMs: Double?,
        progressIntervalMs: Double?,
        onProgress: @escaping (Double) -> Void,
        onTimeout: @escaping () -> Void
    ) {
        let threshold = Self.clampMs(silenceThresholdMs ?? Self.defaultSilenceThresholdMs)
        let interval = Self.clampMs(progressIntervalMs ?? Self.defaultProgressIntervalMs)
        self.silenceThresholdMs = threshold
        self.progressIntervalMs = interval
        self.timeLeftMs = threshold
        self.onProgress = onProgress
        self.onTimeout = onTimeout
    }

    deinit {
        // Never `queue.sync` here. Every method dispatches with
        // `queue.async { guard let self ... }`, which creates a strong
        // reference that is released when the block ends, i.e. ON `queue`.
        // Once the owner has released its own reference (RecognizerEngine's
        // cleanup calls deinitAutoStop on every stop), that block-local
        // reference is the last one, so deinit runs on `queue` and a sync onto
        // the current serial queue deadlocks: libdispatch traps in
        // __DISPATCH_WAIT_FOR_QUEUE__ and the app dies with SIGTRAP.
        //
        // No synchronisation is needed instead: deinit means no other
        // reference exists, and the timer's event handler is [weak self].
        isStopped = true
        timer?.cancel()
        timer = nil
    }

    func resetTimer(from: String) {
        queue.async { [weak self] in
            guard let self, !self.isStopped else { return }
            lg.log("[resetTimer] from:\(from)")
            self.didTimeout = false
            self.timeLeftMs = self.silenceThresholdMs
            self.startOrRescheduleTimerLocked()
            if self.timeLeftMs > 0 {
                self.onProgress(self.timeLeftMs)
            }
        }
    }

    func updateThreshold(_ newThresholdMs: Double, from: String) {
        queue.async { [weak self] in
            guard let self, !self.isStopped else { return }
            lg.log("[updateThreshold] from:\(from) newThresholdMs:\(newThresholdMs)")
            self.silenceThresholdMs = Self.clampMs(newThresholdMs)
        }
    }

    func addMsOnce(_ extraMs: Double, from: String) {
        queue.async { [weak self] in
            guard let self, !self.isStopped, extraMs.isFinite else { return }
            lg.log("[addMsOnce] from:\(from) extraMs:\(extraMs)")
            self.timeLeftMs += extraMs
            self.didTimeout = false
            if self.timeLeftMs > 0, self.timer != nil {
                self.onProgress(self.timeLeftMs)
            }
        }
    }

    func updateProgressInterval(_ newIntervalMs: Double, from: String) {
        queue.async { [weak self] in
            guard let self, !self.isStopped else { return }
            lg.log("[updateProgressInterval] from:\(from) newIntervalMs:\(newIntervalMs)")
            self.progressIntervalMs = Self.clampMs(newIntervalMs)
            if self.timer != nil {
                self.startOrRescheduleTimerLocked()
            }
        }
    }

    func stop() {
        queue.async { [weak self] in
            guard let self else { return }
            self.stopLocked()
            self.timeLeftMs = 0
        }
    }

    private func startOrRescheduleTimerLocked() {
        timer?.cancel()
        timer = nil

        let source = DispatchSource.makeTimerSource(queue: queue)
        let intervalNs = UInt64(progressIntervalMs * 1_000_000)
        source.schedule(
            deadline: .now() + .nanoseconds(Int(intervalNs)),
            repeating: .nanoseconds(Int(intervalNs))
        )
        source.setEventHandler { [weak self] in
            self?.tickLocked()
        }
        timer = source
        source.resume()
    }

    private func tickLocked() {
        guard !isStopped else { return }
        guard !didTimeout else { return }

        timeLeftMs -= progressIntervalMs
        if timeLeftMs > 0 {
            lg.log("[onProgress] timeLeftMs:\(timeLeftMs)")
            onProgress(timeLeftMs)
            return
        }

        timeLeftMs = 0
        didTimeout = true
        cancelTimerLocked()
        lg.log("[onTimeout]")
        onTimeout()
    }

    private func stopLocked() {
        isStopped = true
        cancelTimerLocked()
    }

    private func cancelTimerLocked() {
        timer?.cancel()
        timer = nil
    }

    private static func clampMs(_ value: Double) -> Double {
        if !value.isFinite {
            return minProgressIntervalMs
        }
        return max(minProgressIntervalMs, value)
    }
}
