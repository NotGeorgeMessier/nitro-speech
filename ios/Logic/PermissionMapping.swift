import Foundation

enum PermissionMapping {
    /// Numeric values match the JS / Nitro `PermissionStatus` enum.
    enum Status: Int, Equatable {
        case granted = 0
        case denied = 1
        case notRequested = 2
    }

    /// `SFSpeechRecognizerAuthorizationStatus`: notDetermined=0, denied=1, restricted=2, authorized=3.
    static func fromSpeechAuthorizationRawValue(_ rawValue: Int) -> Status {
        switch rawValue {
        case 0: return .notRequested
        case 1, 2: return .denied
        case 3: return .granted
        default: return .notRequested
        }
    }

    /// `AVAudioApplication.RecordPermission` (iOS 17+): undetermined=0, denied=1, granted=2.
    static func fromAudioApplicationRecordPermissionRawValue(_ rawValue: Int) -> Status {
        switch rawValue {
        case 0: return .notRequested
        case 1: return .denied
        case 2: return .granted
        default: return .notRequested
        }
    }

    /// `AVAudioSession.RecordPermission` FourCharCodes: undt / deny / grnt.
    static let audioSessionUndetermined: UInt = 1_970_168_948
    static let audioSessionDenied: UInt = 1_684_369_017
    static let audioSessionGranted: UInt = 1_735_552_628

    static func fromAudioSessionRecordPermissionRawValue(_ rawValue: UInt) -> Status {
        switch rawValue {
        case audioSessionUndetermined: return .notRequested
        case audioSessionDenied: return .denied
        case audioSessionGranted: return .granted
        default: return .notRequested
        }
    }

    /// Speech is checked first, matching `Permissions.getCombinedStatus()`.
    static func combine(speech: Status, microphone: Status) -> Status {
        if speech == .denied {
            return .denied
        }
        if speech == .notRequested {
            return .notRequested
        }
        if microphone == .denied {
            return .denied
        }
        if microphone == .notRequested {
            return .notRequested
        }
        return .granted
    }
}
