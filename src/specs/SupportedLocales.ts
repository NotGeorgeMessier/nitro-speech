/**
 * On-device locale support report.
 *
 * - `locales` — supported (including downloadable / not yet installed)
 * - `installedLocales` — ready to use without download
 */
export interface SupportedLocales {
  locales: string[]
  installedLocales: string[]
}
