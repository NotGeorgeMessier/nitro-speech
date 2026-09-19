import Foundation
import Speech
import AVFoundation

enum Permissions {
    static func requestAuthorization() async -> SFSpeechRecognizerAuthorizationStatus {
        return await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { authStatus in
                continuation.resume(returning: authStatus)
            }
        }
    }
    
    static func requestMicrophonePermission() async -> Bool {
        if #available(iOS 17.0, *) {
            return await AVAudioApplication.requestRecordPermission()
        }
        return await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }
    
    static func authorizationStatus() -> PermissionStatus {
        toNitro(
            PermissionMapping.fromSpeechAuthorizationRawValue(
                SFSpeechRecognizer.authorizationStatus().rawValue
            )
        )
    }
    
    static func microphonePermissionStatus() -> PermissionStatus {
        if #available(iOS 17.0, *) {
            return toNitro(
                PermissionMapping.fromAudioApplicationRecordPermissionRawValue(
                    AVAudioApplication.shared.recordPermission.rawValue
                )
            )
        }
        return toNitro(
            PermissionMapping.fromAudioSessionRecordPermissionRawValue(
                AVAudioSession.sharedInstance().recordPermission.rawValue
            )
        )
    }
    
    static func getCombinedStatus() -> PermissionStatus {
        let speech = PermissionMapping.fromSpeechAuthorizationRawValue(
            SFSpeechRecognizer.authorizationStatus().rawValue
        )
        let microphone: PermissionMapping.Status
        if #available(iOS 17.0, *) {
            microphone = PermissionMapping.fromAudioApplicationRecordPermissionRawValue(
                AVAudioApplication.shared.recordPermission.rawValue
            )
        } else {
            microphone = PermissionMapping.fromAudioSessionRecordPermissionRawValue(
                AVAudioSession.sharedInstance().recordPermission.rawValue
            )
        }
        return toNitro(PermissionMapping.combine(speech: speech, microphone: microphone))
    }

    private static func toNitro(_ status: PermissionMapping.Status) -> PermissionStatus {
        switch status {
        case .granted: return PermissionStatus.granted
        case .denied: return PermissionStatus.denied
        case .notRequested: return PermissionStatus.notRequested
        }
    }
    
    static func someNotRequested() -> Bool {
        return Permissions.authorizationStatus() == PermissionStatus.notRequested ||
        Permissions.microphonePermissionStatus() == PermissionStatus.notRequested
    }
}
