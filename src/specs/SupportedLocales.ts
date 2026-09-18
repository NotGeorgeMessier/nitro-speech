/**
 * On-device locale support report.
 *
 * - `locales` — supported (including downloadable / not yet installed)
 * - `installedLocales` — installed on-device locales
 */
export interface SupportedLocales {
  locales: string[]
  installedLocales: string[]
}
