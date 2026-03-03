import Foundation
import AVFoundation
import Accelerate

private final class SendablePCMBufferBox: @unchecked Sendable {
    let buffer: AVAudioPCMBuffer
    
    init(_ buffer: AVAudioPCMBuffer) {
        self.buffer = buffer
    }
}

class BufferUtil {
    private static let meterMinDb: Float = -70   // silence floor
    private static let meterMaxDb: Float = -10   // loud speech ceiling
    private static let meterAttack: Float = 0.35 // rise speed
    private static let meterRelease: Float = 0.08 // fall speed
    
    func calcRmsVolume(
        levelSmoothed: Float,
        buffer: AVAudioPCMBuffer
    ) -> (Float, Float)? {
        guard let samples = buffer.floatChannelData?[0] else { return nil }
        
        let frameL = Int(buffer.frameLength)
        var rms: Float = 0
        
        vDSP_rmsqv(samples, 1, &rms, vDSP_Length(frameL))
        
        // 2) RMS -> dBFS
        let db = 20 * log10(rms + 0.00001)

        // 3) Normalize dB to 0...1
        let raw = (db - Self.meterMinDb) / (Self.meterMaxDb - Self.meterMinDb)
        let normalized = max(0, min(1, raw))

        // 4) Smooth (fast attack, slow release)
        let coeff = normalized > levelSmoothed ? Self.meterAttack : Self.meterRelease
        let nextLevelSmoothed = levelSmoothed + coeff * (normalized - levelSmoothed)
        
        return (rms, nextLevelSmoothed)
    }

    func convertBuffer(
        converter: AVAudioConverter,
        audioFormat: AVAudioFormat,
        pcmBuffer: AVAudioPCMBuffer
    ) throws -> AVAudioPCMBuffer?  {
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
