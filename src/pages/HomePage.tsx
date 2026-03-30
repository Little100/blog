import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { MarkdownDocument } from '../markdown/MarkdownDocument'
import { useParsedMarkdown } from '../hooks/useParsedMarkdown'
import { POST_INDEX_BY_LOCALE } from '../i18n/postIndex'
import { CategorySidebar } from '../components/layout/CategorySidebar'
import { TagSidebar } from '../components/layout/TagSidebar'
import { SocialLinks } from '../components/layout/SocialLinks'
import { publicAssetUrl } from '../utils/publicAssetUrl'
import { useLocalePath } from '../utils/useLocalePath'

export function HomePage() {
  const { locale, t } = useI18n()
  const { getLocalePath } = useLocalePath()
  const md = useParsedMarkdown(`/content/${locale}/home.md`)

  const latestPosts = useMemo(() => {
    const posts = POST_INDEX_BY_LOCALE[locale] ?? []
    return [...posts]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 6)
  }, [locale])

  if (md.status === 'loading') {
    return <p className="page-state">{t('state.loading')}</p>
  }
  if (md.status === 'error') {
    return (
      <p className="page-state page-state--error">
        {t('state.error')}: {md.message}
      </p>
    )
  }

  return (
    <div className="page page--home">
      <div className="home-layout">
        <aside className="home-layout__welcome">
          <section className="glass-card home-welcome">
            <h1 className="home-welcome__title">{t('home.welcome')}</h1>
            <MarkdownDocument source={md.body} />
          </section>
        </aside>

        <div className="home-layout__center">
          <section className="home-featured">
            <div className="home-featured__head">
              <h2 className="section-title home-featured__title">{t('home.featured')}</h2>
              <Link to={getLocalePath('/blog')} className="home-featured__all">
                {t('home.viewAll')}
                <span aria-hidden> →</span>
              </Link>
            </div>

            {latestPosts.length === 0 ? (
              <p className="home-featured__empty md-p">{t('home.noPosts')}</p>
            ) : (
              <div className="featured-grid">
                {latestPosts.map((post) => (
                  <Link
                    key={post.slug}
                    to={getLocalePath(`/post/${post.slug}`)}
                    className="post-card"
                  >
                    {post.icon ? (
                      <div className="post-card__img-wrap">
                        <img
                          className="post-card__img"
                          src={publicAssetUrl(post.icon)}
                          alt=""
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div className="post-card__body">
                      <h3 className="post-card__title">{post.title}</h3>
                      {post.excerpt ? (
                        <p className="post-card__excerpt">{post.excerpt}</p>
                      ) : null}
                      <time
                        className="post-card__date"
                        dateTime={post.date}
                      >
                        {post.date}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="home-layout__rail" aria-label={t('sidebar.categories')}>
          <section className="glass-card home-rail">
            <CategorySidebar />
            <TagSidebar />
            <SocialLinks variant="spread" />
          </section>
        </aside>
      </div>
    </div>
  )
}
