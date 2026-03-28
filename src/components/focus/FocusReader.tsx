import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { markPostRelatedNavigation } from '../../utils/postRelatedNav'
import { Moon, Sun, X } from 'lucide-react'
import { MarkdownDocument } from '../../markdown/MarkdownDocument'
import { useTheme } from '../../theme/ThemeContext'
import { LOCALE_LABEL, type Locale } from '../../i18n/translations'
import { useI18n } from '../../i18n/I18nContext'
import { siteConfig } from '../../config/site'
import clsx from 'clsx'

function getLocalePath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (locale === 'en') return normalized
  return `/${locale}${normalized}`
}

export type FocusRelatedItem = {
  slug: string
  title: string
  icon: string
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  author: string
  date: string
  readMinutes: number
  tags?: string[]
  coverSrc: string
  bodyMarkdown: string
  relatedLabel: string
  related: FocusRelatedItem[]
}

export function FocusReader({
  open,
  onClose,
  title,
  author,
  date,
  readMinutes,
  tags,
  coverSrc,
  bodyMarkdown,
  relatedLabel,
  related,
}: Props) {
  const { theme, cycleTheme } = useTheme()
  const { locale, setLocale, t, availableLocales } = useI18n()

  const localePath = (path: string) => getLocalePath(path, locale)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="focus-reader"
          role="dialog"
          aria-modal="true"
          aria-label={siteConfig.title}
          className={clsx(
            'focus-reader',
            theme === 'dark' ? 'focus-reader--dark' : 'focus-reader--light',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <header className="focus-reader__bar">
            <span className="focus-reader__brand">{siteConfig.title}</span>
            <div className="focus-reader__controls">
              <div className="focus-lang" role="group" aria-label={t('focus.lang')}>
                {availableLocales.map((l: Locale) => (
                  <button
                    key={l}
                    type="button"
                    className={`focus-lang__btn${locale === l ? ' focus-lang__btn--active' : ''}`}
                    onClick={() => setLocale(l)}
                  >
                    {LOCALE_LABEL[l]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="focus-icon-btn"
                onClick={cycleTheme}
                aria-label={t('nav.themeCycle')}
                title={t('nav.themeCycle')}
              >
                {theme === 'dark' ? (
                  <Moon size={18} strokeWidth={2} aria-hidden />
                ) : (
                  <Sun size={18} strokeWidth={2} aria-hidden />
                )}
              </button>
              <button
                type="button"
                className="focus-icon-btn focus-icon-btn--close"
                onClick={onClose}
                aria-label={t('focus.close')}
              >
                <X size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>
          </header>

          <div className="focus-reader__scroller">
            <div className="focus-reader__inner">
              <div className="focus-reader__meta">
                <img
                  src={siteConfig.avatar}
                  width={56}
                  height={56}
                  className="focus-reader__meta-avatar"
                  alt=""
                />
                <div className="focus-reader__meta-text">
                  <p className="focus-reader__meta-by">
                    {t('post.by')} {author}
                  </p>
                  {date ? (
                    <p className="focus-reader__meta-line">
                      <time dateTime={date}>{date}</time>
                    </p>
                  ) : null}
                  <p className="focus-reader__meta-line">
                    {readMinutes} {t('post.minRead')}
                  </p>
                  {tags && tags.length > 0 ? (
                    <p className="focus-reader__meta-tags">{tags.join(' · ')}</p>
                  ) : null}
                </div>
              </div>

              <h1 className="focus-reader__title">{title}</h1>

              {coverSrc ? (
                <div className="focus-reader__hero">
                  <img src={coverSrc} alt="" loading="lazy" />
                </div>
              ) : null}

              <div className="focus-reader__markdown">
                <MarkdownDocument source={bodyMarkdown} enableMediaZigzag />
              </div>

              {related.length > 0 ? (
                <div className="focus-reader__related">
                  <h2 className="focus-reader__related-title">{relatedLabel}</h2>
                  <ul className="related-list">
                    {related.filter((r) => r.icon).map((r) => (
                      <li key={r.slug}>
                        <Link
                          to={localePath(`/post/${r.slug}`)}
                          className="related-row"
                          onClick={() => {
                            markPostRelatedNavigation()
                            onClose()
                          }}
                        >
                          {r.icon && (
                            <img src={r.icon} alt="" className="related-row__img" loading="lazy" />
                          )}
                          <span className="related-row__label">{r.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
