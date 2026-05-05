import Foundation
import Speech

@available(iOS 26.0, *)
final class SpeechRuntime: TranscriberRuntime {
    let locale: Locale
    private var transcriber: SpeechTranscriber?
    
    init(with locale: Locale) {
        self.locale = locale
    }
    
    func create(config: SpeechToTextParams?) async throws {
        if !SpeechTranscriber.isAvailable {
            throw NSError()
        }
        var speechTranscriptionOptions: Set<SpeechTranscriber.TranscriptionOption> = []
        if config?.maskOffensiveWords == true {
            speechTranscriptionOptions.insert(.etiquetteReplacements)
        }
        transcriber = SpeechTranscriber(
            locale: locale,
            transcriptionOptions: speechTranscriptionOptions,
            reportingOptions: [.volatileResults, .fastResults],
            attributeOptions: [.audioTimeRange]
        )
        
        

        if let transcriber, let installationRequest = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
            try await installationRequest.downloadAndInstall()
        }
    }
    
    func getModules() -> [any SpeechModule] {
        guard let transcriber else { return [] }
        return [transcriber]
    }
    
    func handleResults(
        onResult: @escaping (TranscriberResult) -> Void
    ) async throws {
        if let transcriber {
            for try await result in transcriber.results {
                onResult(
                    TranscriberResult(
                        text: result.text,
                        rangeStart: result.range.start,
                        isFinal: result.isFinal)
                )
            }
        }
    }
    
    func clean() {
        transcriber = nil
    }
}
