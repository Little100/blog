import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import { MarkdownDocument } from '../markdown/MarkdownDocument'
import { useParsedMarkdown } from '../hooks/useParsedMarkdown'
import { useI18n } from '../i18n/I18nContext'
import { FocusReader } from '../components/focus/FocusReader'
import { POST_INDEX_BY_LOCALE, type PostMeta } from '../i18n/postIndex'
import type { Locale } from '../i18n/translations'
import { firstMarkdownImageSrc, stripFirstMarkdownH1, stripFirstMarkdownImage } from '../utils/markdownTrim'
import { preprocessMarkdownAnnotations } from '../utils/annotationMarkdown'
import { useArticleFocus } from '../focus/ArticleFocusContext'
import { Giscus } from '../components/Giscus'
import { AnnotationBridges, TEXT_ID } from '../components/post/AnnotationBridges'
import { PostReadingRailCard } from '../components/post/PostReadingRailCard'
import { PostAnnotationMarginRoot } from '../components/post/PostAnnotationMarginRoot'
import { AnnotationBubbleProvider } from '../components/post/AnnotationBubbleCtx'
import { CategorySidebar } from '../components/layout/CategorySidebar'
import { SocialLinks } from '../components/layout/SocialLinks'
import { isPostRelatedSlidePending, markPostRelatedNavigation } from '../utils/postRelatedNav'
import { SeoHead } from '../components/seo/SeoHead'
import { siteConfig } from '../config/site'
import { publicAssetUrl } from '../utils/publicAssetUrl'

function relatedForSlug(current: string, loc: Locale): PostMeta[] {
  const posts = POST_INDEX_BY_LOCALE[loc] ?? []
  return posts.filter((b) => b.slug !== current).slice(0, 3)
}

export function PostPage() {
  const { slug } = useParams()
  const safeSlug = slug?.replace(/[^a-zA-Z0-9-_]/g, '') ?? 'kyoto'
  const { locale, t, defaultLocale } = useI18n()
  const url = `/content/${locale}/posts/${safeSlug}.md`
  const md = useParsedMarkdown(url)
  const { setArticleFocusOpener } = useArticleFocus()
  const [focusOpen, setFocusOpen] = useState(false)
  const [postMainWrap, setPostMainWrap] = useState<HTMLDivElement | null>(null)
  const articleSearchRootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const routeIsPresent = useIsPresent()
  const skipBodyReveal = reduceMotion || isPostRelatedSlidePending()

  useEffect(() => {
    setArticleFocusOpener(() => setFocusOpen(true))
    return () => setArticleFocusOpener(null)
  }, [setArticleFocusOpener])

  const resolvedTags = useMemo(() => {
    if (md.status !== 'ok') return []
    return md.meta.tags ?? []
  }, [md])

  const displayTitle = useMemo(() => {
    if (md.status !== 'ok') return ''
    return md.meta.title || safeSlug
  }, [md, safeSlug])

  const bodyForRender = useMemo(() => {
    if (md.status !== 'ok') return ''
    return md.meta.title ? stripFirstMarkdownH1(md.body) : md.body
  }, [md])

  const { body: articleMarkdown, annotations } = useMemo(
    () => preprocessMarkdownAnnotations(bodyForRender, { idPrefix: safeSlug, translate: (s) => s }),
    [bodyForRender, safeSlug],
  )

  const bodyForFocus = useMemo(
    () => stripFirstMarkdownImage(articleMarkdown),
    [articleMarkdown],
  )

  const coverSrc = useMemo(() => {
    if (md.status !== 'ok') return ''
    const hero = md.meta.hero?.trim()
    if (hero) return hero
    return firstMarkdownImageSrc(bodyForRender)
  }, [md, bodyForRender])

  const related = useMemo(() => relatedForSlug(safeSlug, locale), [safeSlug, locale])

  const seoDescriptionText = useMemo(() => {
    if (md.status !== 'ok') return ''
    return md.meta.description?.trim() ?? ''
  }, [md])

  const seoOgImage = useMemo(() => {
    const fromCover = coverSrc.trim()
    if (fromCover) return fromCover
    if (md.status !== 'ok') return ''
    const icon = md.meta.icon?.trim()
    if (icon) return icon
    return ''
  }, [coverSrc, md])

  const getLocalePath = (path: string) =>
    locale === defaultLocale
      ? path.startsWith('/') ? path : `/${path}`
      : `/${locale}${path.startsWith('/') ? path : `/${path}`}`

  const bodyRevealRef = useRef<HTMLDivElement>(null)
  const bodyProgress = useMotionValue(skipBodyReveal ? 1 : 0)
  const bodyClipPath = useTransform(bodyProgress, [0, 1], ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'])

  const [annVisible, setAnnVisible] = useState<boolean[]>([])

  useEffect(() => {
    const n = annotations.length
    setAnnVisible(Array(n).fill(skipBodyReveal))
  }, [annotations.length, skipBodyReveal, safeSlug])

  const syncAnnVisibility = useCallback(() => {
    const n = annotations.length
    if (n === 0) return
    if (skipBodyReveal) {
      setAnnVisible((prev) => (prev.length === n && prev.every(Boolean) ? prev : Array(n).fill(true)))
      return
    }
    const root = bodyRevealRef.current
    if (!root) return
    const v = bodyProgress.get()
    const cr = root.getBoundingClientRect()
    const cutoff = cr.top + v * cr.height + 2
    const next = annotations.map((_, i) => {
      const el = document.getElementById(TEXT_ID(safeSlug, i))
      if (!el) return false
      return el.getBoundingClientRect().bottom <= cutoff
    })
    setAnnVisible((prev) =>
      prev.length === next.length && prev.every((p, j) => p === next[j]) ? prev : next,
    )
  }, [annotations, safeSlug, skipBodyReveal, bodyProgress])

  useMotionValueEvent(bodyProgress, 'change', syncAnnVisibility)

  useEffect(() => {
    if (md.status !== 'ok') {
      bodyProgress.set(skipBodyReveal ? 1 : 0)
      return
    }
    if (skipBodyReveal) {
      bodyProgress.set(1)
      return
    }
    bodyProgress.set(0)
    const ctrl = animate(bodyProgress, 1, { duration: 0.72, ease: [0.22, 1, 0.36, 1] })
    syncAnnVisibility()
    return () => ctrl.stop()
  }, [md.status, skipBodyReveal, safeSlug, bodyProgress, syncAnnVisibility])

  useLayoutEffect(() => {
    if (md.status !== 'ok') return
    const id = requestAnimationFrame(syncAnnVisibility)
    return () => cancelAnimationFrame(id)
  }, [md.status, articleMarkdown, syncAnnVisibility])

  if (md.status === 'loading') {
    const relatedLoading = relatedForSlug(safeSlug, locale)
    return (
      <div className="page page--post">
        <div className="post-3col">
          <aside
            className="post-aside post-aside--left post-aside--annotations-lane"
            aria-hidden
          />

          <div className="post-main-wrap">
            <article className="post-main glass-card">
              <p className="page-state page-state--inline">{t('state.loading')}</p>
            </article>
          </div>

          <aside className="post-aside post-aside--right">
            <div
              className="post-aside__enter"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}
            >
              <div className="related-card glass-card">
                <h2 className="related-card__title">{t('post.related')}</h2>
                <ul className="related-list">
                  {relatedLoading.filter((r) => r.icon).map((r) => (
                    <li key={r.slug}>
                      <Link
                        to={getLocalePath(`/post/${r.slug}`)}
                        className="related-row"
                        onClick={() => markPostRelatedNavigation()}
                      >
                        <img src={publicAssetUrl(r.icon)} alt="" className="related-row__img" loading="lazy" />
                        <span className="related-row__label">{r.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="post-inline-rail glass-card">
                <CategorySidebar />
                <SocialLinks variant="spread" />
              </div>
              <div className="reading-rail-card glass-card post-rail-placeholder" aria-hidden>
                <div className="post-rail-placeholder__line post-rail-placeholder__line--label" />
                <div className="post-rail-placeholder__progress" />
                <div className="post-rail-placeholder__line post-rail-placeholder__line--title" />
                <div className="post-rail-placeholder__search" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    )
  }
  if (md.status === 'error') {
    return (
      <p className="page-state page-state--error">
        {t('state.error')}: {md.message}
      </p>
    )
  }

  const { meta } = md

  const annVisibleForUi =
    annVisible.length === annotations.length
      ? annVisible
      : Array(annotations.length).fill(skipBodyReveal)

  const railEntrance = true

  const seoDescriptionProp = seoDescriptionText.trim() || undefined
  const seoImageProp = seoOgImage.trim() || undefined

  return (
    <>
      <SeoHead
        title={displayTitle}
        description={seoDescriptionProp}
        image={seoImageProp}
        type="article"
        publishedTime={meta.date}
        author={meta.author}
      />
      <div className="page page--post">
        <div className="post-3col">
          <aside className="post-aside post-aside--left post-aside--annotations-lane" aria-hidden />

          <div className="post-main-wrap" ref={setPostMainWrap}>
            <article ref={articleSearchRootRef} className="post-main glass-card">
              <div className="post-head">
                <h1 className="post-title md-h1">{displayTitle}</h1>
                <div className="post-head__dates">
                  <time dateTime={meta.date}>{meta.date}</time>
                  {meta.lastEdited && meta.lastEdited !== meta.date ? (
                    <>
                      {' — '}
                      <time dateTime={meta.lastEdited}>{t('post.lastEdited')} {meta.lastEdited}</time>
                    </>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="focus-enter-btn"
                  onClick={() => setFocusOpen(true)}
                >
                  {t('post.focus')}
                </button>
              </div>
              <motion.div
                ref={bodyRevealRef}
                className="post-main__body-reveal"
                style={{ clipPath: bodyClipPath }}
              >
                <PostAnnotationMarginRoot
                  key={safeSlug}
                  idPrefix={safeSlug}
                  annotations={annotations}
                  annotationCardVisible={annotations.length > 0 ? annVisibleForUi : undefined}
                  marginHidden={focusOpen}
                  marginPortalHost={postMainWrap}
                >
                  <div
                    className={`post-md post-md--columns${focusOpen ? ' post-md--annotations-suppressed' : ''}`}
                    data-annotation-root
                  >
                    <AnnotationBubbleProvider
                      annotations={annotations}
                      idPrefix={safeSlug}
                      disabled={focusOpen}
                    >
                      <MarkdownDocument source={articleMarkdown} enableMediaZigzag />
                    </AnnotationBubbleProvider>
                  </div>
                </PostAnnotationMarginRoot>
                {siteConfig.giscus?.enabled && (
                  <div className="giscus-wrapper">
                    <h2 className="giscus-title">{t('post.comments')}</h2>
                    <Giscus />
                  </div>
                )}
              </motion.div>
            </article>
          </div>

          <aside className="post-aside post-aside--right">
            <motion.div
              className="post-aside__enter"
              initial={railEntrance ? false : { opacity: 0, x: 26 }}
              animate={{ opacity: 1, x: 0 }}
              transition={
                railEntrance
                  ? { duration: 0 }
                  : { duration: 0.52, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
              }
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}
            >
            <div className="related-card glass-card">
              <h2 className="related-card__title">{t('post.related')}</h2>
              <ul className="related-list">
                {related.filter((r) => r.icon).map((r) => (
                  <li key={r.slug}>
                    <Link
                      to={getLocalePath(`/post/${r.slug}`)}
                      className="related-row"
                      onClick={() => markPostRelatedNavigation()}
                    >
                      <img src={publicAssetUrl(r.icon)} alt="" className="related-row__img" loading="lazy" />
                      <span className="related-row__label">{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="post-inline-rail glass-card">
              <CategorySidebar />
              <SocialLinks variant="spread" />
            </div>
            <PostReadingRailCard
              title={displayTitle}
              articleRootRef={articleSearchRootRef}
              tags={resolvedTags}
            />
            </motion.div>
          </aside>
        </div>
      </div>

      <AnnotationBridges
        key={safeSlug}
        idPrefix={safeSlug}
        count={annotations.length}
        active={!focusOpen && routeIsPresent}
        segmentVisible={annotations.length > 0 ? annVisibleForUi : undefined}
        domScope={postMainWrap}
      />

      <FocusReader
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        title={displayTitle}
        author={meta.author}
        date={meta.date}
        lastEdited={meta.lastEdited}
        readMinutes={meta.readMinutes}
        tags={resolvedTags}
        coverSrc={coverSrc}
        bodyMarkdown={bodyForFocus}
        annotations={annotations}
        idPrefix={safeSlug}
        relatedLabel={t('post.related')}
        related={related.filter((r) => r.icon).map((r) => ({
          slug: r.slug,
          title: r.title,
          icon: r.icon,
        }))}
      />
    </>
  )
}
