import Foundation
import Speech
import AVFoundation

final class Permissions {
    private let onGranted: () async -> Void
    private let onDenied: (() -> Void)?
    private let onError: ((String) -> Void)?
    
    init(
        onGranted: @escaping () async -> Void,
        onDenied: (() -> Void)?,
        onError: ((String) -> Void)?
    ) {
        self.onGranted = onGranted
        self.onDenied = onDenied
        self.onError = onError
    }
    
    private func requestMicrophonePermission() async {
        // Request permission to record.
        if #available(iOS 17.0, *) {
            if await AVAudioApplication.requestRecordPermission() {
                await self.onGranted()
                return
            }
            self.onDenied?()
            return
        }
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            Task { @MainActor in
                guard let self else { return }
                if granted {
                    await self.onGranted()
                    return
                }
                self.onDenied?()
            }
        }
    }
    
    func requestAuthorization() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            Task { @MainActor in
                switch authStatus {
                    case .authorized:
                        await self.requestMicrophonePermission()
                    case .denied, .restricted:
                        self.onDenied?()
                    case .notDetermined:
                        self.onError?("Speech recognition not determined")
                    @unknown default:
                        self.onError?("Unknown authorization status")
                }
            }
        }
    }
    
}
