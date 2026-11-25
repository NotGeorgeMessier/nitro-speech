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
    
    static func authorizationStatus() -> SpeechRecognitionPermissionStatus {
        switch SFSpeechRecognizer.authorizationStatus() {
            case .notDetermined: return SpeechRecognitionPermissionStatus.notRequested
            case .denied: return SpeechRecognitionPermissionStatus.denied
            case .restricted: return SpeechRecognitionPermissionStatus.denied
            case .authorized: return SpeechRecognitionPermissionStatus.granted
            @unknown default: return SpeechRecognitionPermissionStatus.notRequested
        }
    }
    
    static func microphonePermissionStatus() -> SpeechRecognitionPermissionStatus {
        if #available(iOS 17.0, *) {
            switch AVAudioApplication.shared.recordPermission {
                case .undetermined: return SpeechRecognitionPermissionStatus.notRequested
                case .denied: return SpeechRecognitionPermissionStatus.denied
                case .granted: return SpeechRecognitionPermissionStatus.granted
                @unknown default: return SpeechRecognitionPermissionStatus.notRequested
            }
        }
        switch AVAudioSession.sharedInstance().recordPermission {
            case .undetermined: return SpeechRecognitionPermissionStatus.notRequested
            case .denied: return SpeechRecognitionPermissionStatus.denied
            case .granted: return SpeechRecognitionPermissionStatus.granted
            @unknown default: return SpeechRecognitionPermissionStatus.notRequested
        }
    }
    
    static func getCombinedStatus() -> SpeechRecognitionPermissionStatus {
        // Return early for the speech recognition permission first
        let speechRecognitionStatus = Permissions.authorizationStatus()
        if speechRecognitionStatus == SpeechRecognitionPermissionStatus.denied {
            return SpeechRecognitionPermissionStatus.denied
        }
        if speechRecognitionStatus == SpeechRecognitionPermissionStatus.notRequested {
            return SpeechRecognitionPermissionStatus.notRequested
        }
        
        // Check micro then
        let micStatus = Permissions.microphonePermissionStatus()
        if micStatus == SpeechRecognitionPermissionStatus.denied {
            return SpeechRecognitionPermissionStatus.denied
        }
        if micStatus == SpeechRecognitionPermissionStatus.notRequested {
            return SpeechRecognitionPermissionStatus.notRequested
        }
        
        // Everything is granted
        return SpeechRecognitionPermissionStatus.granted
    }
    
    static func someNotRequested() -> Bool {
        return Permissions.authorizationStatus() == SpeechRecognitionPermissionStatus.notRequested ||
        Permissions.microphonePermissionStatus() == SpeechRecognitionPermissionStatus.notRequested
    }
}
