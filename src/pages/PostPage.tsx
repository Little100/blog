import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  animate,
  motion,
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
import { BLOG_INDEX, getPostMeta } from '../data/posts'
import { firstMarkdownImageSrc, stripFirstMarkdownH1, stripFirstMarkdownImage } from '../utils/markdownTrim'
import {
  preprocessMarkdownAnnotations,
  stripMarkdownAnnotations,
} from '../utils/annotationMarkdown'
import { useArticleFocus } from '../focus/ArticleFocusContext'
import {
  isDottedI18nKey,
  expandMarkdownI18nKeys,
  resolveTagLabel,
} from '../utils/i18nKeys'
import { Giscus } from '../components/Giscus'
import { AnnotationBridges, TEXT_ID } from '../components/post/AnnotationBridges'
import { PostReadingRailCard } from '../components/post/PostReadingRailCard'
import { PostAnnotationMarginRoot } from '../components/post/PostAnnotationMarginRoot'
import { AnnotationBubbleProvider } from '../components/post/AnnotationBubbleCtx'
import { CategorySidebar } from '../components/layout/CategorySidebar'
import { SocialLinks } from '../components/layout/SocialLinks'
import { isPostRelatedSlidePending, markPostRelatedNavigation } from '../utils/postRelatedNav'
import type { Locale } from '../i18n/translations'
import { SeoHead } from '../components/seo/SeoHead'
import { siteConfig } from '../config/site'

function relatedForSlug(current: string) {
  return BLOG_INDEX.filter((b) => b.slug !== current).slice(0, 3)
}

function getLocalePath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (locale === 'en') return normalized
  return `/${locale}${normalized}`
}

export function PostPage() {
  const { slug } = useParams()
  const safeSlug = slug?.replace(/[^a-zA-Z0-9-_]/g, '') ?? 'kyoto'
  const url = `/content/posts/${safeSlug}.md`
  const md = useParsedMarkdown(url)
  const { locale, t } = useI18n()
  const indexEntry = useMemo(() => getPostMeta(safeSlug), [safeSlug])
  const { setArticleFocusOpener } = useArticleFocus()
  const [focusOpen, setFocusOpen] = useState(false)
  const [postMainWrap, setPostMainWrap] = useState<HTMLDivElement | null>(null)
  const articleSearchRootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const skipBodyReveal = reduceMotion || isPostRelatedSlidePending()

  useEffect(() => {
    setArticleFocusOpener(() => setFocusOpen(true))
    return () => setArticleFocusOpener(null)
  }, [setArticleFocusOpener])

  const resolvedTags = useMemo(() => {
    if (md.status !== 'ok') return []
    return md.meta.tags.map((tag) => resolveTagLabel(tag, t))
  }, [md, t])

  const displayTitle = useMemo(() => {
    if (md.status !== 'ok') return ''
    const { title, titleEn } = md.meta
    if (title && isDottedI18nKey(title)) return t(title)
    if (locale === 'en' && titleEn) return titleEn
    if (title) return title
    const hit = BLOG_INDEX.find((b) => b.slug === safeSlug)
    return hit ? t(hit.titleKey) : safeSlug
  }, [md, locale, safeSlug, t])

  const bodyExpanded = useMemo(() => {
    if (md.status !== 'ok') return ''
    return expandMarkdownI18nKeys(md.body, t)
  }, [md, t])

  const bodyForRender = useMemo(() => {
    if (md.status !== 'ok') return ''
    const raw = bodyExpanded
    if (md.meta.title) return stripFirstMarkdownH1(raw)
    return raw
  }, [md, bodyExpanded])

  const { body: articleMarkdown, annotations } = useMemo(
    () => preprocessMarkdownAnnotations(bodyForRender, { idPrefix: safeSlug, translate: t }),
    [bodyForRender, safeSlug, t],
  )

  const bodyForFocus = useMemo(() => {
    const stripped = stripFirstMarkdownImage(bodyForRender)
    return stripMarkdownAnnotations(stripped)
  }, [bodyForRender])

  const coverSrc = useMemo(() => {
    if (md.status !== 'ok') return ''
    const hero = md.meta.hero?.trim()
    if (hero) return hero
    return firstMarkdownImageSrc(bodyForRender)
  }, [md, bodyForRender])

  const related = useMemo(() => relatedForSlug(safeSlug), [safeSlug])

  const seoDescriptionKey = useMemo(() => {
    if (md.status !== 'ok') {
      return ''
    }
    const fmDesc = md.meta.description
    let k = ''
    if (fmDesc) {
      const trimmed = fmDesc.trim()
      if (trimmed && isDottedI18nKey(trimmed)) {
        k = trimmed
      }
    }
    if (!k && indexEntry) {
      const dk = indexEntry.descriptionKey
      if (dk) {
        const trimmed = dk.trim()
        if (trimmed && isDottedI18nKey(trimmed)) {
          k = trimmed
        }
      }
    }
    return k
  }, [md, indexEntry])

  const seoDescriptionText = useMemo(() => {
    if (!seoDescriptionKey) {
      return ''
    }
    const s = t(seoDescriptionKey)
    if (s === seoDescriptionKey) {
      return ''
    }
    return s
  }, [seoDescriptionKey, t])

  const seoOgImage = useMemo(() => {
    const fromCover = coverSrc.trim()
    if (fromCover) {
      return fromCover
    }
    if (indexEntry) {
      const ic = indexEntry.icon
      if (ic) {
        const trimmed = ic.trim()
        if (trimmed) {
          return trimmed
        }
      }
    }
    return ''
  }, [coverSrc, indexEntry])

  const localePath = (path: string) => getLocalePath(path, locale)

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
    return () => ctrl.stop()
  }, [md.status, skipBodyReveal, safeSlug, bodyProgress])

  useLayoutEffect(() => {
    if (md.status !== 'ok') return
    syncAnnVisibility()
    const id = requestAnimationFrame(syncAnnVisibility)
    return () => cancelAnimationFrame(id)
  }, [md.status, articleMarkdown, syncAnnVisibility])

  if (md.status === 'loading') {
    const relatedLoading = relatedForSlug(safeSlug)
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
                        to={localePath(`/post/${r.slug}`)}
                        className="related-row"
                        onClick={() => markPostRelatedNavigation()}
                      >
                        <img src={r.icon} alt="" className="related-row__img" loading="lazy" />
                        <span className="related-row__label">{t(r.titleKey)}</span>
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

  let seoDescriptionProp: string | undefined
  if (seoDescriptionText.trim()) {
    seoDescriptionProp = seoDescriptionText.trim()
  } else {
    seoDescriptionProp = undefined
  }

  let seoImageProp: string | undefined
  if (seoOgImage.trim()) {
    seoImageProp = seoOgImage.trim()
  } else {
    seoImageProp = undefined
  }

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
                      to={localePath(`/post/${r.slug}`)}
                      className="related-row"
                      onClick={() => markPostRelatedNavigation()}
                    >
                      <img src={r.icon} alt="" className="related-row__img" loading="lazy" />
                      <span className="related-row__label">{t(r.titleKey)}</span>
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
        idPrefix={safeSlug}
        count={annotations.length}
        active={!focusOpen}
        segmentVisible={annotations.length > 0 ? annVisibleForUi : undefined}
      />

      <FocusReader
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        title={displayTitle}
        author={meta.author}
        date={meta.date}
        readMinutes={meta.readMinutes}
        tags={resolvedTags}
        coverSrc={coverSrc}
        bodyMarkdown={bodyForFocus}
        relatedLabel={t('post.related')}
        related={related.filter((r) => r.icon).map((r) => ({
          slug: r.slug,
          title: t(r.titleKey),
          icon: r.icon,
        }))}
      />
    </>
  )
}
