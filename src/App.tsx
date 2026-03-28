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

function createPageRoutes() {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="blog" element={<BlogListPage />} />
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

export default function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route element={<LocaleRoute locale="en" />}>
          {createPageRoutes()}
        </Route>
      </Route>

      {availableLocales
        .filter((l) => l !== 'en')
        .map((locale) => (
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
