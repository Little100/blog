import type { Locale } from './translations'
import { LOCALE_DEFS } from './translations'
import { PRIVACY_POLICY_STRINGS } from './privacyPolicyStrings'

export type ContentBundleJson = Record<string, Partial<Record<Locale, string>>>

const modules = import.meta.glob('./content/**/*.json', {
  eager: true,
}) as Record<string, { default: ContentBundleJson }>

const LOCALES = LOCALE_DEFS.map((d) => d.code) as Locale[]

export function buildContentStringsByLocale(): Record<Locale, Record<string, string>> {
  const out: Record<Locale, Record<string, string>> = {
    en: {},
    ja: {},
    zh: {},
    'zh-TW': {},
  }
  for (const mod of Object.values(modules)) {
    const bundle = mod.default
    for (const [key, perLocale] of Object.entries(bundle)) {
      for (const loc of LOCALES) {
        const v = perLocale[loc]
        if (v !== undefined && v !== '') {
          out[loc][key] = v
        }
      }
    }
  }
  for (const loc of LOCALES) {
    Object.assign(out[loc], PRIVACY_POLICY_STRINGS[loc])
  }
  return out
}

export const CONTENT_STRINGS_BY_LOCALE = buildContentStringsByLocale()
