import Foundation
import Speech

struct TranscriberResult {
    let text: AttributedString
    let rangeStart: CMTime
    let isFinal: Bool
}

@available(iOS 26.0, *)
protocol TranscriberRuntime {
    var locale: Locale? { get set }

    func checkLocale(locale: Locale) async -> Bool
    
    func create(config: SpeechToTextParams?) async throws
    
    func getModules() -> [any SpeechModule]
    
    func handleResults(onResult: @escaping (TranscriberResult) -> Void) async throws
    
    func clean() -> Void
}