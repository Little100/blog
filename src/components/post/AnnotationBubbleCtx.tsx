import { createContext, useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnnoBodyText } from './AnnoBodyText'
import { createPortal } from 'react-dom'
import { useI18n } from '../../i18n/I18nContext'
import type { MarkdownAnnotation } from '../../utils/annotationMarkdown'
import { annotationTone, sanitizeAnnoIdPrefix } from '../../utils/annotationVariation'

export type AnnotationBubbleApi = {
  open: (index: number, target: HTMLElement) => void
  toggle: (index: number, target: HTMLElement) => void
}

export const AnnotationBubbleCtx = createContext<AnnotationBubbleApi | null>(null)

type Props = {
  annotations: MarkdownAnnotation[]
  idPrefix?: string
  disabled?: boolean
  children: React.ReactNode
}

type Place = { left: number; top: number; above: boolean }

function calcPlace(target: HTMLElement): Place | null {
  const r = target.getBoundingClientRect()
  const bubbleH = 120
  const above = r.top > bubbleH + 24
  const cx = r.left + r.width / 2
  const maxW = Math.min(320, window.innerWidth - 24)
  const left = Math.min(Math.max(12, cx - maxW / 2), window.innerWidth - 12 - maxW)
  return {
    left,
    top: above ? r.top - 10 : r.bottom + 10,
    above,
  }
}

export function AnnotationBubbleProvider({
  annotations,
  idPrefix = 'p',
  disabled,
  children,
}: Props) {
  const { t } = useI18n()
  const uid = useId().replace(/:/g, '')
  const annRef = useRef(annotations)
  annRef.current = annotations

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const openIndexRef = useRef<number | null>(null)
  openIndexRef.current = openIndex

  const close = useCallback(() => {
    setOpenIndex(null)
    setPlace(null)
  }, [])

  const open = useCallback((index: number, target: HTMLElement) => {
    if (disabled || index < 0 || index >= annRef.current.length) return
    const p = calcPlace(target)
    if (!p) return
    setOpenIndex(index)
    setPlace(p)
  }, [disabled])

  const toggle = useCallback((index: number, target: HTMLElement) => {
    if (disabled || index < 0 || index >= annRef.current.length) return
    if (openIndexRef.current === index) {
      setOpenIndex(null)
      setPlace(null)
      return
    }
    const p = calcPlace(target)
    if (!p) return
    setOpenIndex(index)
    setPlace(p)
  }, [disabled])

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onScroll = () => close()
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [openIndex, close])

  const entry = openIndex !== null ? annRef.current[openIndex] : undefined
  const bodyText = entry?.body ?? ''
  const titleText = entry?.title?.trim() ? entry.title.trim() : t('post.annotations')
  const bubbleTone =
    openIndex !== null ? annotationTone(sanitizeAnnoIdPrefix(idPrefix), openIndex) : 0

  const bubble =
    openIndex !== null && place !== null ? (
      <>
        <div className="anno-mobile-pop-backdrop" aria-hidden onClick={close} />
        <div
          id={`anno-mobile-pop-${uid}`}
          className={`anno-mobile-wechat glass-card anno-mobile-wechat--tone-${bubbleTone}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`anno-mobile-pop-title-${uid}`}
          style={{
            position: 'fixed',
            left: place.left,
            top: place.top,
            transform: place.above ? 'translateY(-100%)' : 'none',
            zIndex: 90,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p id={`anno-mobile-pop-title-${uid}`} className="anno-mobile-wechat__tip">
            {titleText}
          </p>
          <AnnoBodyText text={bodyText} className="anno-mobile-wechat__body" />
          <span
            className={`anno-mobile-wechat__tail anno-mobile-wechat__tail--${place.above ? 'bottom' : 'top'}`}
            aria-hidden
          />
        </div>
      </>
    ) : null

  return (
    <AnnotationBubbleCtx.Provider value={{ open, toggle }}>
      {children}
      {typeof document !== 'undefined' ? createPortal(bubble, document.body) : null}
    </AnnotationBubbleCtx.Provider>
  )
}
