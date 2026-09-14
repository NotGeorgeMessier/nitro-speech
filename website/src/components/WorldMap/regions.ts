import {countries} from './countries'
import {pathBBox} from './locales'

export const REGION_IDS = ['na', 'eu', 'as', 'so'] as const
export type RegionId = (typeof REGION_IDS)[number]

export type RegionTab = {
  id: RegionId
  label: string
  ids: ReadonlySet<string>
  viewBox: string
}

const NA = [
  'BS',
  'BZ',
  'CA',
  'CR',
  'CU',
  'DO',
  'GL',
  'GT',
  'HN',
  'HT',
  'JM',
  'MX',
  'NI',
  'PA',
  'PR',
  'SV',
  'TT',
  'US',
]

/** Europe + Turkey + Caucasus. Maghreb/Egypt are not on this tab. */
const EU = [
  'AL',
  'AM',
  'AT',
  'AZ',
  'BA',
  'BE',
  'BG',
  'BY',
  'CH',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GB',
  'GE',
  'GR',
  'HR',
  'HU',
  'IE',
  'IS',
  'IT',
  'LT',
  'LU',
  'LV',
  'MD',
  'ME',
  'MK',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'RS',
  'SE',
  'SI',
  'SK',
  'TR',
  'UA',
  'XK',
]

const AFRICA = new Set([
  'AO',
  'BF',
  'BI',
  'BJ',
  'BW',
  'CD',
  'CF',
  'CG',
  'CI',
  'CM',
  'DJ',
  'DZ',
  'EG',
  'EH',
  'ER',
  'ET',
  'GA',
  'GH',
  'GM',
  'GN',
  'GQ',
  'GW',
  'KE',
  'LR',
  'LS',
  'LY',
  'MA',
  'MG',
  'ML',
  'MR',
  'MW',
  'MZ',
  'NA',
  'NE',
  'NG',
  'RW',
  'SD',
  'SL',
  'SN',
  'SO',
  'SS',
  'SZ',
  'TD',
  'TG',
  'TN',
  'TZ',
  'UG',
  'ZA',
  'ZM',
  'ZW',
])

const SA = [
  'AR',
  'BO',
  'BR',
  'CL',
  'CO',
  'EC',
  'FK',
  'GY',
  'PE',
  'PY',
  'SR',
  'UY',
  'VE',
]

/** Southern half of Africa on this projection (centroid y ≥ 242). */
const SOUTHERN_AFRICA = countries
  .filter((c) => {
    if (!AFRICA.has(c.id)) return false
    const box = pathBBox(c.d)
    return (box.y + box.height * 0.5) >= 242
  })
  .map((c) => c.id)

const ASSIGNED = new Set([...NA, ...EU, ...SA, ...SOUTHERN_AFRICA])

/** Asia & Oceania: Levant / Caspian to the Pacific. No Africa, no Russia. */
const AS = countries
  .map((c) => c.id)
  .filter((id) => !ASSIGNED.has(id) && !AFRICA.has(id) && id !== 'RU' && id !== 'SOL')

export const REGION_TABS: RegionTab[] = [
  {
    id: 'na',
    label: 'North America',
    ids: new Set(NA),
    viewBox: '18 22 250 175',
  },
  {
    id: 'eu',
    label: 'Europe',
    /** Western Russia sits on this crop. */
    ids: new Set([...EU, 'RU']),
    viewBox: '341 40 187 110',
  },
  {
    id: 'as',
    label: 'Asia & Oceania',
    ids: new Set(AS),
    viewBox: '468 84 322 284',
  },
  {
    id: 'so',
    label: 'South America & Southern Africa',
    ids: new Set([...SA, ...SOUTHERN_AFRICA]),
    viewBox: '150 190 345 210',
  },
]

const BY_COUNTRY = new Map<string, RegionId>()
for (const tab of REGION_TABS) {
  for (const id of tab.ids) BY_COUNTRY.set(id, tab.id)
}

export function regionForCountry(id: string): RegionId | null {
  return BY_COUNTRY.get(id) ?? null
}
