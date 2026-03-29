import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export function NotFoundPage() {
  const { t, locale } = useI18n()

  // Build locale-prefixed paths (English also has /en prefix).
  const homePath = `/${locale}/`
  const blogPath = `/${locale}/blog`

  return (
    <div className="page page--not-found">
      <div className="not-found__layout">
        <div className="not-found__code">404</div>
        <h1 className="not-found__title">{t('notFound.title')}</h1>
        <p className="not-found__message">{t('notFound.message')}</p>
        <div className="not-found__actions">
          <Link to={homePath} className="not-found__link not-found__link--primary">
            {t('notFound.goHome')}
          </Link>
          <Link to={blogPath} className="not-found__link">
            {t('notFound.browsePosts')}
          </Link>
        </div>
      </div>
    </div>
  )
}
