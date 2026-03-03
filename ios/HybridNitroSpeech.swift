import Foundation
import NitroModules

class HybridNitroSpeech : HybridNitroSpeechSpec {
    var recognizer: any HybridRecognizerSpec

    override init() {
        if #available(iOS 26.0, *) {
            recognizer = AnalyzerTranscriber()
        } else {
            recognizer = LegacySpeechRecognizer()
        }
        super.init()
    }
}
