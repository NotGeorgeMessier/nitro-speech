export const phrases = [
  'Hello World',
  'Start speech recognition',
  'with React Native Nitro Speech.',
  "Let's ******* go!",
  'Press Get started',
  // Spanish
  'Hola Mundo',
  'Pulsa Empezar',
  // French
  'Bonjour le monde',
  'Appuyez sur Commencer',
  // German
  'Hallo Welt',
  'Loslegen drücken',
  // Polish
  'Witaj świecie',
  'Naciśnij Zacznij',
  // Japanese
  'こんにちは世界',
  'はじめるを押してください',
  // Chinese
  '你好，世界',
  '按开始使用',
]

/** Language blocks matching `phrases` order. */
export const languages = [
  {id: 'en', label: 'English', start: 0, end: 4},
  {id: 'es', label: 'Spanish', start: 5, end: 6},
  {id: 'fr', label: 'French', start: 7, end: 8},
  {id: 'de', label: 'German', start: 9, end: 10},
  {id: 'pl', label: 'Polish', start: 11, end: 12},
  {id: 'ja', label: 'Japanese', start: 13, end: 14},
  {id: 'zh', label: 'Chinese', start: 15, end: 16},
] as const

export type LanguageId = (typeof languages)[number]['id']

/** Language slot for a phrase index (wrap-safe). */
export function languageIndexForPhrase(phraseIndex: number): number {
  const i = ((phraseIndex % phrases.length) + phrases.length) % phrases.length
  const idx = languages.findIndex((lang) => i >= lang.start && i <= lang.end)
  return idx < 0 ? 0 : idx
}

/** After these phrase indices (end of each language block), enter silence. */
export const SILENCE_AFTER_PHRASE_INDICES = new Set([
  4, // English — "Press Get started"
  16, // Chinese
])
