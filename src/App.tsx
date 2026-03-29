import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteShell } from './components/layout/SiteShell'
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
import { localeFromNavigatorOrHeader } from './i18n/parseAcceptLanguage'
import type { Locale } from './i18n/translations'
import rawConfig from '../config.json'

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

const availableLocales = enabledLocales()

/** Redirects / to the user's preferred locale based on browser settings or stored preference. */
function RootRedirect() {
  const stored = localStorage.getItem('BLOG-locale')
  if (stored && availableLocales.includes(stored as Locale)) {
    return <Navigate to={`/${stored}/`} replace />
  }
  const detected = localeFromNavigatorOrHeader()
  if (availableLocales.includes(detected)) {
    return <Navigate to={`/${detected}/`} replace />
  }
  return <Navigate to={`/${availableLocales[0] ?? 'en'}/`} replace />
}

function createPageRoutes() {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="blog" element={<BlogListPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="changelog" element={<ChangelogPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="post/:slug" element={<PostPage />} />
      <Route path="tags" element={<TagsPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="terms" element={<ContactPage />} />
      <Route path="404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </>
  )
}

/**
 * All locales (including English) use a /{locale} prefix in the URL:
 *   /en/, /en/blog, /en/post/:slug
 *   /zh/, /zh/blog, /zh/post/:slug
 *
 * This makes language-switching and locale-based canonical paths unambiguous.
 */
export default function App() {
  // Handle GitHub Pages 404 fallback BEFORE rendering routes.
  // Reading sessionStorage here (before Routes) ensures the ?origin= redirect
  // fires synchronously and takes priority over RootRedirect's Navigate.
  const originRedirect = (() => {
    const stored = sessionStorage.getItem('__spa_origin__')
    if (stored) {
      sessionStorage.removeItem('__spa_origin__')
      return <Navigate to={stored} replace />
    }
    return null
  })()

  return (
    <>
      {originRedirect}
      <Routes>
        {/* Redirect root to user's preferred locale so every URL carries a locale prefix */}
        <Route path="/" element={<RootRedirect />} />

        {availableLocales.map((locale) => (
          <Route
            key={locale}
            path={`/${locale}`}
            element={<SiteShell />}
          >
            <Route element={<LocaleRoute locale={locale} />}>
              {createPageRoutes()}
            </Route>
          </Route>
        ))}

        {/* Fallback for any URL that doesn't match a locale prefix */}
        <Route path="*" element={<Navigate to={`/${availableLocales[0] ?? 'en'}/`} replace />} />
      </Routes>
    </>
  )
}
