import Foundation

enum RecognizerError: Error {
    case unknown
    case alreadyStopped
    case onDeviceNotAvailable
    case audioBufferConversion
    case speechTranscriberNotAvailable
}
