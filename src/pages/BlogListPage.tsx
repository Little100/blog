import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CategorySidebar } from '../components/layout/CategorySidebar'
import { TagSidebar } from '../components/layout/TagSidebar'
import { SocialLinks } from '../components/layout/SocialLinks'
import { useI18n } from '../i18n/I18nContext'
import { POST_INDEX_BY_LOCALE } from '../i18n/postIndex'
import { postMatchesTagSlug } from '../utils/blogTags'
import { useLocalePath } from '../utils/useLocalePath'

const BLOG_PAGE_SIZE = 20

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
  const { threshold = 0.1 } = options ?? {}

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    }, { threshold })
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

export function BlogListPage() {
  const { t, locale } = useI18n()
  const { getLocalePath } = useLocalePath()
  const [searchParams] = useSearchParams()
  const tagSlug = (searchParams.get('tag') ?? '').trim()

  const posts = POST_INDEX_BY_LOCALE[locale] ?? []

  const filtered = useMemo(() => {
    return posts.filter((p) => postMatchesTagSlug(p, tagSlug))
  }, [posts, tagSlug])

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

  const loadMore = () => {
    setVisibleCount((c) => Math.min(c + BLOG_PAGE_SIZE, filtered.length))
  }

  const loadMoreRef = useLoadMoreSentinel(hasMore, loadMore)
  const { ref: listRef, inView: listInView } = useInView()
  const reduce = useReducedMotion()

  return (
    <div className="page page--blog">
      <div className="layout-split">
        <div className="layout-split__main">
          <h1 className="page-hero-title">{t('blog.title')}</h1>
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
                <Link to={getLocalePath(`/post/${post.slug}`)} className="blog-row glass-card">
                  {post.icon && (
                    <div className="blog-row__thumb">
                      <img src={post.icon} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="blog-row__text">
                    <h2 className="blog-row__title">{post.title}</h2>
                    <time className="blog-row__date" dateTime={post.date}>
                      {post.date}
                    </time>
                    {post.excerpt && <p className="blog-row__excerpt">{post.excerpt}</p>}
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

        <aside className="layout-split__aside" aria-label={t('sidebar.categories')}>
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
