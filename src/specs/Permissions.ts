/**
 * Permission status for microphone and speech recognition.
 *
 * iOS: speech recognition and microphone are separate permissions.
 *
 * Android: only `RECORD_AUDIO` is required
 *
 * - `GRANTED` — both required permissions are authorized.
 * - `DENIED` — at least one permission was explicitly denied by the user.
 * - `NOT_REQUESTED` — permission has never been requested
 */
export enum PermissionStatus {
  GRANTED,
  DENIED,
  NOT_REQUESTED,
}
