import Foundation
import NitroModules

class HybridRecognizer : HybridRecognizerSpec {
    var onReadyForSpeech: (() -> Void)?
    
    var onRecordingStopped: (() -> Void)?
    
    var onResult: (([String]) -> Void)?
    
    var onError: ((String) -> Void)?
    
    var onPermissionDenied: (() -> Void)?
    
    func startListening(params: Params) {
        onReadyForSpeech?()
        return;
    }
    
    func stopListening() {
        onEndOfSpeech?()
        onResult?([""], false)
        return;
    }
    func destroy() {
        return;
    }
}
