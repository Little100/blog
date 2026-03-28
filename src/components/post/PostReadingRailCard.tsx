import { useEffect, useState, type FormEvent, type RefObject } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import { searchInArticleDom } from '../../utils/articleDomSearch'

type Props = {
  title: string
  articleRootRef: RefObject<HTMLElement | null>
  tags?: string[]
}

export function PostReadingRailCard({ title, articleRootRef, tags = [] }: Props) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [progress, setProgress] = useState(0)
  const [lastHint, setLastHint] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const denom = el.scrollHeight - el.clientHeight
      const pct =
        denom > 0 ? Math.min(100, Math.round((el.scrollTop / denom) * 100)) : 0
      setProgress(pct)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const needle = q.trim()
    if (!needle) {
      setLastHint(null)
      return
    }
    const root = articleRootRef.current
    const { found } = searchInArticleDom(root, needle)
    if (found === 0) {
      setLastHint(t('post.searchThisArticleNone'))
    } else {
      setLastHint(t('post.searchThisArticleHits').replaceAll('{n}', String(found)))
    }
  }

  return (
    <div className="reading-rail-card glass-card">
      <p className="reading-rail-card__label">{t('post.readingProgress')}</p>
      <div className="reading-rail-card__progress-track" aria-hidden>
        <div
          className="reading-rail-card__progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="reading-rail-card__pct">{progress}%</p>
      <h2 className="reading-rail-card__title">{title}</h2>
      <form className="reading-rail-card__search" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="reading-rail-search">
          {t('post.searchThisArticle')}
        </label>
        <input
          id="reading-rail-search"
          type="search"
          className="reading-rail-card__input"
          placeholder={t('post.searchThisArticlePlaceholder')}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setLastHint(null)
          }}
          autoComplete="off"
        />
        <button type="submit" className="reading-rail-card__submit">
          {t('nav.search')}
        </button>
      </form>
      {tags.length > 0 ? (
        <p className="reading-rail-card__tags">
          {tags.map((tag, i) => (
            <span key={`${tag}-${i}`}>
              {i > 0 ? ' · ' : null}
              {tag}
            </span>
          ))}
        </p>
      ) : null}
      {lastHint ? (
        <p className="reading-rail-card__hint" role="status">
          {lastHint}
        </p>
      ) : null}
    </div>
  )
}
