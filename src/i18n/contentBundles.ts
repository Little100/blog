import type { Locale } from './translations'
import { LOCALE_DEFS } from './translations'
import { PRIVACY_POLICY_STRINGS } from './privacyPolicyStrings'

export type ContentBundleJson = Record<string, Partial<Record<Locale, string>>>

const modules = import.meta.glob('./content/**/*.json', {
  eager: true,
}) as Record<string, { default: ContentBundleJson }>

const LOCALES = LOCALE_DEFS.map((d) => d.code) as Locale[]

export interface ModifiedKeys {
  [key: string]: {
    [loc in Locale]?: boolean
  }
}

export interface HereMarkerError {
  file: string
  keys: string[]
}

function detectHereMarkers(jsonString: string): string[] {
  const markers: string[] = []
  const regex = /"([^"]+)":\s*"([^"]*)"\s*,\s*#\s*here\s*$/gm
  let match
  while ((match = regex.exec(jsonString)) !== null) {
    markers.push(match[1])
  }
  return markers
}

export function detectAllHereMarkers(): HereMarkerError[] {
  const errors: HereMarkerError[] = []
  for (const [filePath, mod] of Object.entries(modules)) {
    const rawJson = (mod as unknown as { default: string }).default as unknown as string
    if (typeof rawJson !== 'string') continue
    const keys = detectHereMarkers(rawJson)
    if (keys.length > 0) {
      errors.push({ file: filePath, keys })
    }
  }
  return errors
}

export function buildContentStringsByLocale(): {
  strings: Record<Locale, Record<string, string>>
  modifiedKeys: ModifiedKeys
} {
  const out: Record<Locale, Record<string, string>> = {
    en: {},
    ja: {},
    zh: {},
    'zh-TW': {},
  }
  const modifiedKeys: ModifiedKeys = {}

  for (const mod of Object.values(modules)) {
    const bundle = mod.default
    for (const [key, perLocale] of Object.entries(bundle)) {
      const keyModified: Partial<Record<Locale, boolean>> = {}
      const row = perLocale as Record<string, string | boolean | undefined>

      for (const loc of LOCALES) {
        const v = row[loc]
        if (typeof v === 'string' && v !== '') {
          out[loc][key] = v
        }

        const modifiedMarker = `#here_${loc}`
        if (row[modifiedMarker]) {
          keyModified[loc] = true
        }
      }

      if (Object.keys(keyModified).length > 0) {
        modifiedKeys[key] = keyModified as ModifiedKeys[string]
      }
    }
  }
  for (const loc of LOCALES) {
    Object.assign(out[loc], PRIVACY_POLICY_STRINGS[loc])
  }
  return { strings: out, modifiedKeys }
}

export const CONTENT_STRINGS_RESULT = buildContentStringsByLocale()
export const CONTENT_STRINGS_BY_LOCALE = CONTENT_STRINGS_RESULT.strings
export const CONTENT_MODIFIED_KEYS = CONTENT_STRINGS_RESULT.modifiedKeys

export function isContentModified(slug: string): boolean {
  const prefix = `post.${slug}.`
  return Object.keys(CONTENT_MODIFIED_KEYS).some(key => key.startsWith(prefix))
}
