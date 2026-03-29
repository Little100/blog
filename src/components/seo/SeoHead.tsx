/**
 * SEO Head Component
 * Injects meta tags, Open Graph, Twitter Card, and hreflang links
 */
import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { siteConfig, resolveLocalized } from '../../config/site'
import { publicAssetUrl } from '../../utils/publicAssetUrl'
import { useI18n } from '../../i18n/I18nContext'
import { LOCALE_DEFS } from '../../i18n/translations'
import type { Locale } from '../../i18n/translations'

export type SeoProps = {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'article'
  /** For article pages: the publish date in ISO format */
  publishedTime?: string
  /** For article pages: the author name */
  author?: string
  /**
   * When true and `title` is set, `document.title` and og/twitter titles use only `title`
   * (no ` — ${siteTitle}` suffix). Useful for blog posts titled from Markdown frontmatter.
   */
  titleOnly?: boolean
}

function docLangTag(locale: Locale): string {
  const tag: Record<Locale, string> = {
    en: 'en',
    ja: 'ja',
    zh: 'zh-CN',
    'zh-TW': 'zh-TW',
  }
  return tag[locale] ?? 'en'
}

function localePathPrefix(locale: Locale): string {
  return `/${locale}`
}

function buildAbsoluteUrl(path: string, locale: Locale): string {
  const base = siteConfig.seo.siteUrl.replace(/\/$/, '')
  const prefix = localePathPrefix(locale)
  return `${base}${prefix}${path}`
}

function createMetaTag(props: Record<string, string>) {
  const el = document.createElement('meta')
  for (const [key, value] of Object.entries(props)) {
    el.setAttribute(key, value)
  }
  return el
}

function iconMimeFromHref(href: string): string | undefined {
  const lower = href.split('?')[0]?.toLowerCase() ?? ''
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.ico')) return 'image/x-icon'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return undefined
}

function absolutizeForOg(image: string | undefined): string | undefined {
  if (!image?.trim()) return undefined
  const t = image.trim()
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  const base = siteConfig.seo.siteUrl.replace(/\/$/, '')
  const path = t.startsWith('/') ? t : `/${t}`
  return `${base}${path}`
}

export function SeoHead({
  title,
  description,
  image,
  type = 'website',
  publishedTime,
  author,
  titleOnly = false,
}: SeoProps) {
  const { locale, availableLocales, t } = useI18n()
  const { pathname } = useLocation()

  // Determine the base page path without locale prefix
  const pagePath = useMemo(() => {
    const prefix = localePathPrefix(locale)
    if (prefix) {
      return pathname.replace(new RegExp(`^${prefix}`), '') || '/'
    }
    return pathname
  }, [pathname, locale])

  // Site-level defaults
  const siteTitle = resolveLocalized(siteConfig.seo.title, locale, t('nav.home'))
  const siteDescription = resolveLocalized(siteConfig.seo.description, locale, '')
  const absoluteImage = absolutizeForOg(image)
  const defaultOgImage =
    absoluteImage || `${siteConfig.seo.siteUrl}${siteConfig.seo.ogImage || '/og-image.png'}`
  const ogImage = absoluteImage || defaultOgImage

  // Resolve title
  const resolvedTitle =
    title && titleOnly ? title : title ? `${title} — ${siteTitle}` : siteTitle

  // Resolve description
  const resolvedDescription = description || siteDescription

  // Current page URL
  const currentUrl = buildAbsoluteUrl(pagePath, locale)

  // Filter available locales for hreflang
  const activeLocales = LOCALE_DEFS.filter((d) =>
    availableLocales.includes(d.code as Locale)
  )

  useEffect(() => {
    // Update document title
    document.title = resolvedTitle

    // Favicon / PWA-ish icons from config (overrides static index.html defaults after load)
    const icons = siteConfig.icons
    if (icons?.favicon) {
      let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (!iconLink) {
        iconLink = document.createElement('link')
        iconLink.rel = 'icon'
        document.head.appendChild(iconLink)
      }
      iconLink.href = publicAssetUrl(icons.favicon)
      const mime = iconMimeFromHref(icons.favicon)
      if (mime) iconLink.type = mime
      else iconLink.removeAttribute('type')
    }
    const appleHref = icons?.appleTouchIcon ?? icons?.favicon
    if (appleHref) {
      let apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
      if (!apple) {
        apple = document.createElement('link')
        apple.rel = 'apple-touch-icon'
        document.head.appendChild(apple)
      }
      apple.href = publicAssetUrl(appleHref)
      const mime = iconMimeFromHref(appleHref)
      if (mime) apple.type = mime
      else apple.removeAttribute('type')
    }
    if (icons?.maskIcon) {
      let mask = document.querySelector<HTMLLinkElement>('link[rel="mask-icon"]')
      if (!mask) {
        mask = document.createElement('link')
        mask.rel = 'mask-icon'
        document.head.appendChild(mask)
      }
      mask.href = publicAssetUrl(icons.maskIcon)
    }
    const theme = icons?.themeColor?.trim()
    if (theme) {
      let tc = document.querySelector('meta[name="theme-color"]')
      if (!tc) {
        tc = createMetaTag({ name: 'theme-color', content: theme })
        document.head.appendChild(tc)
      } else {
        tc.setAttribute('content', theme)
      }
      let tile = document.querySelector('meta[name="msapplication-TileColor"]')
      if (!tile) {
        tile = createMetaTag({ name: 'msapplication-TileColor', content: theme })
        document.head.appendChild(tile)
      } else {
        tile.setAttribute('content', theme)
      }
    }

    // Update or create meta tags
    const updateMeta = (name: string, content: string, isProperty?: boolean) => {
      const attr = isProperty ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = createMetaTag({ [attr]: name, content })
        document.head.appendChild(el)
      } else {
        el.setAttribute('content', content)
      }
    }

    // Basic meta
    updateMeta('description', resolvedDescription)
    updateMeta('author', author || siteConfig.defaultAuthor)

    // Open Graph
    updateMeta('og:title', resolvedTitle, true)
    updateMeta('og:description', resolvedDescription, true)
    updateMeta('og:image', ogImage, true)
    updateMeta('og:url', currentUrl, true)
    updateMeta('og:type', type, true)
    updateMeta('og:site_name', siteTitle, true)

    if (type === 'article' && publishedTime) {
      updateMeta('article:published_time', publishedTime, true)
    }

    // Twitter Card
    const twitterHandle = siteConfig.seo.twitterHandle
    updateMeta('twitter:card', 'summary_large_image', true)
    updateMeta('twitter:title', resolvedTitle, true)
    updateMeta('twitter:description', resolvedDescription, true)
    updateMeta('twitter:image', ogImage, true)
    if (twitterHandle) {
      updateMeta('twitter:site', twitterHandle, true)
      updateMeta('twitter:creator', twitterHandle, true)
    }

    // Update html lang
    document.documentElement.lang = docLangTag(locale)

    // Clean up old hreflang links
    const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]')
    existingHreflangs.forEach((el) => el.remove())

    // Add hreflang links for all locales + x-default
    const addHreflang = (hreflang: string, href: string) => {
      const link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = hreflang
      link.href = href
      document.head.appendChild(link)
    }

    // Add x-default (English as fallback)
    const defaultLocale = siteConfig.seo.defaultLocale || 'en'
    const defaultLocaleObj = LOCALE_DEFS.find((d) => d.code === defaultLocale)
    if (defaultLocaleObj) {
      const defaultLocaleForUrl = defaultLocale as Locale
      addHreflang('x-default', buildAbsoluteUrl(pagePath, defaultLocaleForUrl))
    }

    // Add hreflang for each available locale
    for (const def of activeLocales) {
      const hreflang = def.tag
      const href = buildAbsoluteUrl(pagePath, def.code as Locale)
      addHreflang(hreflang, href)
    }

    // Update canonical URL
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', currentUrl)
  }, [
    resolvedTitle,
    resolvedDescription,
    ogImage,
    currentUrl,
    type,
    publishedTime,
    author,
    locale,
    siteTitle,
    activeLocales,
    pagePath,
  ])

  // This component doesn't render anything visible
  return null
}
