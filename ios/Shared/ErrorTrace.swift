import Foundation

enum ErrorTrace {
    static func join(_ segments: String...) -> String {
        join(segments)
    }

    static func join(_ segments: [String]) -> String {
        segments.filter { !$0.isEmpty }.joined(separator: ".")
    }
}
