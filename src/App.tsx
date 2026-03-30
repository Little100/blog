import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteShell } from './components/layout/SiteShell'
import { DefaultLocalePrefixRedirect } from './components/locale/DefaultLocalePrefixRedirect'
import { LocaleRoute } from './components/locale/LocaleRoute'
import { AboutPage } from './pages/AboutPage'
import { BlogListPage } from './pages/BlogListPage'
import { ChangelogPage } from './pages/ChangelogPage'
import { ContactPage } from './pages/ContactPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { HomePage } from './pages/HomePage'
import { PostPage } from './pages/PostPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { TagsPage } from './pages/TagsPage'
import { LOCALE_DEFS } from './i18n/translations'
import type { Locale } from './i18n/translations'
import rawConfig from '../config.json'
import { ErrorBoundary } from './components/ErrorBoundary'

const ALL_LOCALES: Locale[] = LOCALE_DEFS.map((d) => d.code) as Locale[]

function enabledLocales(): Locale[] {
  const configured = (rawConfig as Record<string, unknown>).languages
  if (Array.isArray(configured) && configured.length > 0) {
    return configured.filter((l: unknown) =>
      ALL_LOCALES.includes(l as Locale),
    ) as Locale[]
  }
  return ALL_LOCALES
}

function getDefaultLocale(): Locale {
  const dl = (rawConfig as Record<string, unknown>).defaultLanguage
  if (dl && ALL_LOCALES.includes(dl as Locale)) return dl as Locale
  return enabledLocales()[0] ?? 'en'
}

const availableLocales = enabledLocales()

/**
 * Routing layout:
 *
 *   /                     → default locale home (no prefix)
 *   /blog, /post/:slug   → default locale pages
 *   /404                 → NotFoundPage for default locale
 *
 *   /{locale}/           → other locales (always prefixed)
 *   /{locale}/blog       → other locale blog
 *   /{locale}/post/:slug  → other locale post
 *   /{locale}/404         → NotFoundPage for non-default locale
 *
 * The I18nProvider detects locale from the URL by checking for locale prefix
 * first, then falls back to localStorage and finally the first configured locale.
 *
 * This layout gives clean root URLs for the default language while ensuring
 * every language has proper SEO-friendly URLs with a locale prefix.
 */
export default function App() {
  const originRedirect = (() => {
    const stored = sessionStorage.getItem('__spa_origin__')
    if (stored) {
      sessionStorage.removeItem('__spa_origin__')
      return <Navigate to={stored} replace />
    }
    return null
  })()

  const defaultLocale = getDefaultLocale()
  const otherLocales = availableLocales.filter((l) => l !== defaultLocale)

  return (
    <>
      {originRedirect}
      <Routes>
        {/* Default language should live at / — redirect /{defaultLocale}/… bookmarks */}
        <Route
          path={`/${defaultLocale}`}
          element={<Navigate to="/" replace />}
        />
        <Route
          path={`/${defaultLocale}/*`}
          element={<DefaultLocalePrefixRedirect defaultLocale={defaultLocale} />}
        />

        {/* Default locale: no /{locale} prefix in URL, serves at root */}
        <Route path="/" element={<SiteShell />}>
          <Route element={<LocaleRoute locale={defaultLocale} />}>
            <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
            <Route path="blog" element={<ErrorBoundary><BlogListPage /></ErrorBoundary>} />
            <Route path="about" element={<ErrorBoundary><AboutPage /></ErrorBoundary>} />
            <Route path="changelog" element={<ErrorBoundary><ChangelogPage /></ErrorBoundary>} />
            <Route path="contact" element={<ErrorBoundary><ContactPage /></ErrorBoundary>} />
            <Route path="post/:slug" element={<ErrorBoundary><PostPage /></ErrorBoundary>} />
            <Route path="tags" element={<ErrorBoundary><TagsPage /></ErrorBoundary>} />
            <Route path="privacy" element={<ErrorBoundary><PrivacyPage /></ErrorBoundary>} />
            <Route path="terms" element={<ErrorBoundary><ContactPage /></ErrorBoundary>} />
            <Route path="404" element={<NotFoundPage />} />
            <Route
              path="*"
              element={<Navigate to="/404" replace />}
            />
          </Route>
        </Route>

        {/* Other locales: always carry /{locale} prefix */}
        {otherLocales.map((locale) => (
          <Route
            key={locale}
            path={`/${locale}`}
            element={<SiteShell />}
          >
            <Route element={<LocaleRoute locale={locale} />}>
              <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
              <Route path="blog" element={<ErrorBoundary><BlogListPage /></ErrorBoundary>} />
              <Route path="about" element={<ErrorBoundary><AboutPage /></ErrorBoundary>} />
              <Route path="changelog" element={<ErrorBoundary><ChangelogPage /></ErrorBoundary>} />
              <Route path="contact" element={<ErrorBoundary><ContactPage /></ErrorBoundary>} />
              <Route path="post/:slug" element={<ErrorBoundary><PostPage /></ErrorBoundary>} />
              <Route path="tags" element={<ErrorBoundary><TagsPage /></ErrorBoundary>} />
              <Route path="privacy" element={<ErrorBoundary><PrivacyPage /></ErrorBoundary>} />
              <Route path="terms" element={<ErrorBoundary><ContactPage /></ErrorBoundary>} />
              <Route path="404" element={<NotFoundPage />} />
              <Route
                path="*"
                element={<Navigate to={`/${locale}/404`} replace />}
              />
            </Route>
          </Route>
        ))}

        {/* Outer catch-all: any unmapped path → default locale 404 */}
        <Route
          path="*"
          element={<Navigate to="/404" replace />}
        />
      </Routes>
    </>
  )
}
