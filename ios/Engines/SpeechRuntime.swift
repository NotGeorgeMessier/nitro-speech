import Foundation
import Speech

@available(iOS 26.0, *)
final class SpeechRuntime: TranscriberRuntime {
    var locale: Locale?
    
    private var transcriber: SpeechTranscriber?
    
    func checkLocale(locale: Locale) async -> Bool {
        guard SpeechTranscriber.isAvailable else { return false }
//        self.locale = await SpeechTranscriber.supportedLocale(equivalentTo: locale)
        return self.locale != nil
    }
    
    func create(config: SpeechToTextParams?) async throws {
        guard let locale else {return}
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
        locale = nil
        transcriber = nil
    }
}
