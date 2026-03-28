import rawConfig from '../../config.json'
import type { Locale } from '../i18n/translations'

export type SocialPlatform =
  | 'github'
  | 'instagram'
  | 'twitter'
  | 'x'
  | 'linkedin'
  | 'mastodon'
  | 'email'

export type SocialLinkConfig = {
  platform: SocialPlatform
  href: string
  label: LocalizedString
  icon?: string
  detail?: LocalizedString
}

export type GiscusConfig = {
  enabled: boolean
  repo: string
  repoId: string
  category: string
  categoryId: string
  mapping: string
  reactionsEnabled: string
  emitMetadata: string
  inputPosition: string
  lang: string
}

export type FooterLinkConfig = {
  label: LocalizedString
  href: string
}

export type FooterConfig = {
  tagline: LocalizedString
  copyright?: LocalizedString
  links?: FooterLinkConfig[]
}

export type SeoConfig = {
  siteUrl: string
  description: LocalizedString
  defaultLocale: string
  title?: LocalizedString
  twitterHandle?: string
  ogImage?: string
}

export type AnalyticsConfig = {
  enabled: boolean
  provider: string
  url: string
  id: string
}

export type BuildConfig = {
  compressAssets: boolean
  targetFormat: string
}

export type IconsConfig = {
  favicon: string
  appleTouchIcon?: string
  maskIcon?: string
  themeColor?: string
}

export type LocalizedString = string | Partial<Record<Locale, string>>

export function resolveLocalized(
  value: LocalizedString | undefined,
  locale: Locale,
  fallback: string,
): string {
  if (value == null) return fallback
  if (typeof value === 'string') {
    const t = value.trim()
    return t.length > 0 ? value : fallback
  }
  const fromLocale = value[locale]?.trim()
  if (fromLocale) return value[locale]!
  const fromEn = value.en?.trim()
  if (fromEn) return value.en!
  const first = (Object.values(value) as string[])
    .map((v) => v.trim())
    .find(Boolean)
  return first ?? fallback
}

export type ContactLocalizedString = LocalizedString

export function resolveContactLocalized(
  value: ContactLocalizedString | undefined,
  locale: Locale,
  fallback: string,
): string {
  return resolveLocalized(value, locale, fallback)
}

export type ContactSectionConfig = {
  icon: LocalizedString
  title: LocalizedString
  body: LocalizedString
}

export type ContactPageConfig = {
  title?: LocalizedString
  lead?: LocalizedString
  sections?: ContactSectionConfig[]
}

type RawConfig = typeof rawConfig

export const siteConfig = {
  title: rawConfig.title as RawConfig['title'],
  avatar: rawConfig.avatar as string,
  defaultAuthor: rawConfig.defaultAuthor as RawConfig['defaultAuthor'],
  exportContactPath: rawConfig.exportContactPath as RawConfig['exportContactPath'],
  social: rawConfig.social as SocialLinkConfig[],
  giscus: rawConfig.giscus as GiscusConfig,
  footer: rawConfig.footer as FooterConfig,
  seo: rawConfig.seo as SeoConfig,
  icons: rawConfig.icons as IconsConfig,
  analytics: rawConfig.analytics as AnalyticsConfig,
  build: rawConfig.build as BuildConfig,
  contact: (rawConfig.contact ?? undefined) as ContactPageConfig | undefined,
} as const
