import Foundation
import AVFoundation

private final class SendablePCMBufferBox: @unchecked Sendable {
    let buffer: AVAudioPCMBuffer
    
    init(_ buffer: AVAudioPCMBuffer) {
        self.buffer = buffer
    }
}

enum AudioBufferConverter {
    static func convertBuffer(
        converter: AVAudioConverter,
        audioFormat: AVAudioFormat,
        pcmBuffer: AVAudioPCMBuffer
    ) throws -> AVAudioPCMBuffer? {
        let resampledCapacity = AVAudioFrameCount(
            (Double(pcmBuffer.frameLength) * (audioFormat.sampleRate / pcmBuffer.format.sampleRate)).rounded(.up)
        )
        let convertedCapacity = max(pcmBuffer.frameLength, max(1, resampledCapacity))
        guard let convertedBuffer = AVAudioPCMBuffer(pcmFormat: audioFormat, frameCapacity: convertedCapacity) else {
            throw NSError()
        }
        
        let inputBufferBox = SendablePCMBufferBox(pcmBuffer)
        var didProvideInput = false
        var conversionError: NSError?
        let status = converter.convert(to: convertedBuffer, error: &conversionError) { _, outStatus in
            if didProvideInput {
                outStatus.pointee = .noDataNow
                return nil
            }
            didProvideInput = true
            outStatus.pointee = .haveData
            return inputBufferBox.buffer
        }
        if let conversionError {
            throw conversionError
        }
        guard status == .haveData || status == .inputRanDry else {
            return nil
        }
        guard convertedBuffer.frameLength > 0 else {
            return nil
        }
        return convertedBuffer
    }
}
