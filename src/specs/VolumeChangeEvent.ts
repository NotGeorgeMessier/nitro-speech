/**
 * Contains data about each audio buffer volume.
 *
 * Emits with high frequency.
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
   * May vary on different devices and audio engines.
   *
   * db 0 is still a sound, undefined is no sound.
   */
  db?: number
}
