/**
 * Contains data about each audio buffer volume.
 */
export interface VolumeChangeEvent {
  /**
   * Smoothed voice input volume
   *
   * Normalized to a range of 0 to 1.
   *
   * Best choice for UI animations.
   */
  smoothedVolume: number
  /**
   * Raw voice input volume
   *
   * Normalized to a range of 0 to 1.
   *
   * Appropriate for internal logic, quick reactions, not UI.
   */
  rawVolume: number
  /**
   * Audio buffer volume in decibels.
   *
   * Values will vary on different devices, however still appropriate for displaying in UI.
   *
   * db 0 is still a sound, undefined is no sound or disabled event.
   */
  db?: number
}
