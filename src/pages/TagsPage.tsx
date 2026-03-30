import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { POST_INDEX_BY_LOCALE } from '../i18n/postIndex'
import { aggregateTagsFromPosts } from '../utils/blogTags'

export function TagsPage() {
  const { t, locale, defaultLocale } = useI18n()
  const posts = POST_INDEX_BY_LOCALE[locale] ?? []

  const tags = useMemo(() => aggregateTagsFromPosts(posts), [posts])

  const getLocalePath = (path: string) =>
    locale === defaultLocale
      ? path.startsWith('/') ? path : `/${path}`
      : `/${locale}${path.startsWith('/') ? path : `/${path}`}`

  return (
    <div className="page page--tags">
      <div className="tags-page__layout">
        <h1 className="page-hero-title">{t('tags.title')}</h1>
        <p className="tags-page__lead">{t('tags.lead')}</p>

        <div className="tags-cloud">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              to={`${getLocalePath('/blog')}?tag=${encodeURIComponent(tag.slug)}`}
              className="tag-pill tags-cloud__tag"
              style={{
                fontSize: `${Math.min(1 + tag.count * 0.15, 1.4)}rem`,
                padding: `${0.3 + tag.count * 0.1}rem ${0.6 + tag.count * 0.2}rem`,
              }}
            >
              {tag.label}
              <span className="tags-cloud__count">{tag.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
