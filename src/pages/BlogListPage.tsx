import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { SocialLinks } from '../components/layout/SocialLinks'
import { useI18n } from '../i18n/I18nContext'
import { BLOG_INDEX } from '../data/posts'
import { filterBlogIndexByQuery } from '../utils/blogSearch'
import { postMatchesTagSlug } from '../utils/blogTags'
import { CategorySidebar } from '../components/layout/CategorySidebar'
import type { Locale } from '../i18n/translations'

const BLOG_PAGE_SIZE = 20

function getLocalePath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (locale === 'en') return normalized
  return `/${locale}${normalized}`
}

function useLoadMoreSentinel(hasMore: boolean, onLoadMore: () => void) {
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (!hasMore) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { rootMargin: '280px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, onLoadMore])
  return ref
}

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLUListElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    }, { threshold: 0.1, ...options })
    observer.observe(el)
    return () => observer.disconnect()
  }, [options])

  return { ref, inView }
}

export function BlogListPage() {
  const { t, locale } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const tagSlug = searchParams.get('tag')?.trim() ?? ''

  const postsForTag = useMemo(() => {
    if (!tagSlug) return BLOG_INDEX
    return BLOG_INDEX.filter((p) => postMatchesTagSlug(p, tagSlug))
  }, [tagSlug])

  const setQ = (v: string) => {
    const next = new URLSearchParams(searchParams)
    if (v.trim()) next.set('q', v)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }
  const [filtered, setFiltered] = useState(BLOG_INDEX)
  const [searchBusy, setSearchBusy] = useState(false)
  const { ref: listRef, inView: listInView } = useInView()
  const reduce = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const needle = q.trim()
      if (!needle) {
        setFiltered(postsForTag)
        setSearchBusy(false)
        return
      }
      setSearchBusy(true)
      const next = await filterBlogIndexByQuery(postsForTag, needle, locale, t)
      if (!cancelled) {
        setFiltered(next)
        setSearchBusy(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [q, locale, t, postsForTag])

  const filteredKey = useMemo(() => filtered.map((p) => p.slug).join('\0'), [filtered])
  const [visibleCount, setVisibleCount] = useState(BLOG_PAGE_SIZE)
  useEffect(() => {
    setVisibleCount(BLOG_PAGE_SIZE)
  }, [filteredKey])

  const visiblePosts = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  )
  const hasMore = visibleCount < filtered.length

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + BLOG_PAGE_SIZE, filtered.length))
  }, [filtered.length])

  const loadMoreRef = useLoadMoreSentinel(hasMore, loadMore)

  const localePath = (path: string) => getLocalePath(path, locale)

  return (
    <div className="page page--blog">
      <div className="layout-split">
        <div className="layout-split__main">
          <h1 className="page-hero-title">{t('blog.title')}</h1>
          {searchBusy ? (
            <p className="blog-search-status" aria-live="polite">
              {t('blog.searching')}
            </p>
          ) : null}
          <ul className="blog-list" ref={listRef}>
            {visiblePosts.map((post, i) => (
              <motion.li
                key={post.slug}
                className="blog-list__item"
                style={{ transformOrigin: '0% 50%' }}
                initial={reduce ? { x: 0, rotateZ: 0 } : { x: -48, rotateZ: -1.25 }}
                animate={
                  listInView
                    ? { x: 0, rotateZ: 0 }
                    : reduce
                      ? { x: 0, rotateZ: 0 }
                      : { x: -48, rotateZ: -1.25 }
                }
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness: 280,
                        damping: 18,
                        mass: 0.9,
                        delay: i * 0.065,
                      }
                }
              >
                <Link to={localePath(`/post/${post.slug}`)} className="blog-row glass-card">
                  {post.icon && (
                    <div className="blog-row__thumb">
                      <img src={post.icon} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="blog-row__text">
                    <h2 className="blog-row__title">{t(post.titleKey)}</h2>
                    <time className="blog-row__date" dateTime={post.date}>
                      {post.date}
                    </time>
                    <p className="blog-row__excerpt">{t(post.excerptKey)}</p>
                  </div>
                </Link>
              </motion.li>
            ))}
            {hasMore ? (
              <li
                ref={loadMoreRef}
                className="blog-list__sentinel"
                aria-hidden="true"
              />
            ) : null}
          </ul>
        </div>

        <aside className="layout-split__aside">
          <CategorySidebar />
          <div className="sidebar-card">
            <label className="sidebar-card__title" htmlFor="blog-search">
              {t('nav.search')}
            </label>
            <input
              id="blog-search"
              type="search"
              className="blog-search-input"
              placeholder={t('blog.searchPlaceholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="sidebar-card">
            <h2 className="sidebar-card__title">{t('blog.recent')}</h2>
            <ul className="recent-list">
              {BLOG_INDEX.map((p) => (
                <li key={p.slug}>
                  <Link to={localePath(`/post/${p.slug}`)}>{t(p.titleKey)}</Link>
                </li>
              ))}
            </ul>
          </div>
          <SocialLinks variant="spread" />
        </aside>
      </div>
    </div>
  )
}
