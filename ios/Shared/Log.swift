import Foundation
import os.log

enum Log {
   static let isLogging = true
   static let subsystem = "com.margelo.nitro.nitrospeech"
   static let category = "NitroSpeech"
   static func log(_ text: String) {
       if isLogging {
           let tn = Thread.current.isMainThread ? "main" : "bg"
           Logger(subsystem: subsystem, category: category).info(
            "[thread]: \(tn) | \(text)"
           )
       }
   }
}

final class Lg {
    private let isLogging: Bool
    static let subsystem = "com.margelo.nitro.nitrospeech"
    static let category = "NitroSpeech"
    let prefix: String
    init(prefix: String, disable: Bool? = false) {
        self.prefix = prefix
        self.isLogging = !(disable ?? false)
    }
    var prevMs: Double?
    func log(_ text: String) {
        if self.isLogging {
            let nowMs = ProcessInfo.processInfo.systemUptime * 1000
            let diff = Int(round(nowMs - (self.prevMs ?? nowMs)))
            self.prevMs = nowMs
            let tn = Thread.current.isMainThread ? "main" : "bg"
            Logger(
                subsystem: Self.subsystem,
                category: Self.category
            ).info("[thread]: \(tn) | {\(self.prefix)} diff: \(diff) | \(text)")
        }
    }
}
