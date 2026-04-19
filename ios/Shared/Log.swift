import Foundation
import os.log

enum Log {
   static let isLogging = true
   static let subsystem = "com.margelo.nitro.nitrospeech"
   static let category = "NitroSpeech"
   static func log(_ text: String) {
       if isLogging {
           let tn = Thread.current.isMainThread ? "main" : "bg"
           let qos = Thread.current.qualityOfService.rawValue
           let tp = Thread.current.threadPriority
           let thread = "\(tn)/\(qos)/\(tp)"
           Logger(subsystem: subsystem, category: category).info(
            "[thread]: \(thread) | \(text)"
           )
       }
   }
}

final class Lg {
    static let isLogging = true
    static let subsystem = "com.margelo.nitro.nitrospeech"
    static let category = "NitroSpeech"
    let prefix: String
    init(prefix: String) {
        self.prefix = prefix
    }
    var prevMs: Double?
    func log(_ text: String) {
        if Self.isLogging {
            let nowMs = ProcessInfo.processInfo.systemUptime * 1000
            let diff = Int(round(nowMs - (self.prevMs ?? nowMs)))
            self.prevMs = nowMs
            let tn = Thread.current.isMainThread ? "main" : "bg"
            let qos = Thread.current.qualityOfService.rawValue
            let tp = Thread.current.threadPriority
            let thread = "\(tn)/\(qos)/\(tp)"
            Logger(
                subsystem: Self.subsystem,
                category: Self.category
            ).info("[thread]: \(thread) | {\(self.prefix)} diff: \(diff) | \(text)")
        }
    }
}
