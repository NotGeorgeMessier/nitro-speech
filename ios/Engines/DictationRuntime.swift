import Foundation
import Speech

@available(iOS 26.0, *)
final class DictationRuntime: TranscriberRuntime {
    let locale: Locale
    private var transcriber: DictationTranscriber?
    
    init(with locale: Locale) {
        self.locale = locale
    }
    
    func create(config: SpeechToTextParams?) async throws {
        var dictationTranscriptionOptions: Set<DictationTranscriber.TranscriptionOption> = [
            .punctuation
        ]
        if config?.maskOffensiveWords == true {
            dictationTranscriptionOptions.insert(.etiquetteReplacements)
        }
        if config?.iosAddPunctuation == false
            || config?.iosPreset == IosPreset.shortform {
            dictationTranscriptionOptions.remove(.punctuation)
        }
        var contentHints: Set<DictationTranscriber.ContentHint> = [
            .shortForm,
            .farField,
        ]
        if config?.iosAtypicalSpeech == true {
            contentHints.insert(.atypicalSpeech)
        }
        transcriber = DictationTranscriber(
            locale: locale,
            contentHints: contentHints,
            transcriptionOptions: dictationTranscriptionOptions,
            reportingOptions: [.frequentFinalization, .volatileResults],
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
