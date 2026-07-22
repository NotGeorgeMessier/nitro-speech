import Foundation

enum RecognizerError: Error {
    case unknown
    case onDeviceNotAvailable
    case audioBufferConversion
    case speechTranscriberNotAvailable
}
