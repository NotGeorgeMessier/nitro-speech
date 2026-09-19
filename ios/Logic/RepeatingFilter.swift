import Foundation

enum RepeatingFilter {
    /// Drops consecutive duplicate tokens while keeping numbers and a stable prefix.
    static func apply(_ text: String) -> String {
        var subStrings = text.split { $0.isWhitespace }.map { String($0) }
        if #available(iOS 16.0, macOS 13.0, *) {
            var shift = 0
            while shift < subStrings.count, !subStrings[shift].contains(/\w+/) {
                shift += 1
            }
            if shift > 0, shift < subStrings.count {
                subStrings = Array(subStrings.suffix(subStrings.count - shift))
            }
        }
        guard !subStrings.isEmpty else { return text }

        var joiner = ""
        if subStrings.count >= 10 {
            joiner = subStrings.prefix(subStrings.count - 9).joined(separator: " ")
            subStrings = Array(subStrings.suffix(10))
        } else {
            joiner = subStrings.first ?? ""
        }
        for i in subStrings.indices {
            if i == 0 { continue }
            if #available(iOS 16.0, macOS 13.0, *), subStrings[i].contains(/\d+/) {
                joiner += " \(subStrings[i])"
                continue
            }
            if subStrings[i] == subStrings[i - 1] { continue }
            joiner += " \(subStrings[i])"
        }
        return joiner
    }
}
