import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MarkdownDocument } from '../markdown/MarkdownDocument'
import { useParsedMarkdown } from '../hooks/useParsedMarkdown'
import { useI18n } from '../i18n/I18nContext'
import { CategorySidebar } from '../components/layout/CategorySidebar'
import { TagSidebar } from '../components/layout/TagSidebar'
import { SocialLinks } from '../components/layout/SocialLinks'
import { BLOG_INDEX } from '../data/posts'
import { expandMarkdownI18nKeys } from '../utils/i18nKeys'

export function HomePage() {
  const md = useParsedMarkdown('/content/home.md')
  const { t } = useI18n()

  const homeBody = useMemo(() => {
    if (md.status !== 'ok') return ''
    return expandMarkdownI18nKeys(md.body, t)
  }, [md, t])

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

  const featured = BLOG_INDEX

  return (
    <div className="page page--home">
      <div className="home-layout">
        <aside className="home-layout__welcome">
          <section className="glass-card home-welcome">
            <h2 className="home-welcome__title">{t('home.welcome')}</h2>
            <MarkdownDocument source={homeBody} />
          </section>
        </aside>

        <div className="home-layout__center">
          <section className="home-featured">
            <h2 className="section-title">{t('home.featured')}</h2>
            <div className="featured-grid">
              {featured.map((post) => (
                <Link key={post.slug} to={`/post/${post.slug}`} className="post-card">
                  {post.icon && (
                    <div className="post-card__img-wrap">
                      <img src={post.icon} alt="" className="post-card__img" loading="lazy" />
                    </div>
                  )}
                  <div className="post-card__body">
                    <h3 className="post-card__title">{t(post.titleKey)}</h3>
                    <p className="post-card__excerpt">{t(post.excerptKey)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="home-layout__rail" aria-label={t('sidebar.categories')}>
          <section className="glass-card home-rail">
            <CategorySidebar />
            <div className="sidebar-card sidebar-card--tags">
              <TagSidebar />
            </div>
            <SocialLinks variant="spread" />
          </section>
        </aside>
      </div>
    </div>
  )
}
