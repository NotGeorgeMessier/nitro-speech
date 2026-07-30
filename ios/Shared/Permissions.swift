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
        switch SFSpeechRecognizer.authorizationStatus() {
            case .notDetermined: return PermissionStatus.notRequested
            case .denied: return PermissionStatus.denied
            case .restricted: return PermissionStatus.denied
            case .authorized: return PermissionStatus.granted
            @unknown default: return PermissionStatus.notRequested
        }
    }
    
    static func microphonePermissionStatus() -> PermissionStatus {
        if #available(iOS 17.0, *) {
            switch AVAudioApplication.shared.recordPermission {
                case .undetermined: return PermissionStatus.notRequested
                case .denied: return PermissionStatus.denied
                case .granted: return PermissionStatus.granted
                @unknown default: return PermissionStatus.notRequested
            }
        }
        switch AVAudioSession.sharedInstance().recordPermission {
            case .undetermined: return PermissionStatus.notRequested
            case .denied: return PermissionStatus.denied
            case .granted: return PermissionStatus.granted
            @unknown default: return PermissionStatus.notRequested
        }
    }
    
    static func getCombinedStatus() -> PermissionStatus {
        // Return early for the speech recognition permission first
        let speechRecognitionStatus = Permissions.authorizationStatus()
        if speechRecognitionStatus == PermissionStatus.denied {
            return PermissionStatus.denied
        }
        if speechRecognitionStatus == PermissionStatus.notRequested {
            return PermissionStatus.notRequested
        }
        
        // Check micro then
        let micStatus = Permissions.microphonePermissionStatus()
        if micStatus == PermissionStatus.denied {
            return PermissionStatus.denied
        }
        if micStatus == PermissionStatus.notRequested {
            return PermissionStatus.notRequested
        }
        
        // Everything is granted
        return PermissionStatus.granted
    }
    
    static func someNotRequested() -> Bool {
        return Permissions.authorizationStatus() == PermissionStatus.notRequested ||
        Permissions.microphonePermissionStatus() == PermissionStatus.notRequested
    }
}
