import {
  createContext,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
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

const HOLE_PAD_PX = 4

type HoleRect = { top: number; left: number; width: number; height: number }

function measureHole(target: HTMLElement | null): HoleRect | null {
  if (!target) return null
  const r = target.getBoundingClientRect()
  const pad = HOLE_PAD_PX
  const left = Math.max(0, r.left - pad)
  const top = Math.max(0, r.top - pad)
  const width = r.width + pad * 2
  const height = r.height + pad * 2
  if (width < 1 || height < 1) return null
  return { left, top, width, height }
}

function MobilePopHitStrips({
  hole,
  onClose,
}: {
  hole: HoleRect | null
  onClose: () => void
}) {
  if (!hole) return null
  const { top, left, width, height } = hole
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0
  const right = left + width
  const bottom = top + height

  return (
    <>
      {top > 0 ? (
        <button
          type="button"
          className="anno-mobile-pop-strip"
          tabIndex={-1}
          aria-label="Close"
          style={{ top: 0, left: 0, right: 0, height: top }}
          onClick={onClose}
        />
      ) : null}
      {bottom < vh ? (
        <button
          type="button"
          className="anno-mobile-pop-strip"
          tabIndex={-1}
          aria-label="Close"
          style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
          onClick={onClose}
        />
      ) : null}
      {left > 0 && bottom > top ? (
        <button
          type="button"
          className="anno-mobile-pop-strip"
          tabIndex={-1}
          aria-label="Close"
          style={{ top, left: 0, width: left, height }}
          onClick={onClose}
        />
      ) : null}
      {right < vw && bottom > top ? (
        <button
          type="button"
          className="anno-mobile-pop-strip"
          tabIndex={-1}
          aria-label="Close"
          style={{ top, left: right, right: 0, height }}
          onClick={onClose}
        />
      ) : null}
    </>
  )
}

type Props = {
  annotations: MarkdownAnnotation[]
  idPrefix?: string
  disabled?: boolean
  children: ReactNode
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
  const [holeRect, setHoleRect] = useState<HoleRect | null>(null)
  const openIndexRef = useRef<number | null>(null)
  openIndexRef.current = openIndex
  const anchorElRef = useRef<HTMLElement | null>(null)

  const syncHole = useCallback(() => {
    setHoleRect(measureHole(anchorElRef.current))
  }, [])

  const close = useCallback(() => {
    setOpenIndex(null)
    setPlace(null)
    setHoleRect(null)
    anchorElRef.current = null
  }, [])

  const open = useCallback((index: number, target: HTMLElement) => {
    if (disabled || index < 0 || index >= annRef.current.length) return
    const p = calcPlace(target)
    if (!p) return
    anchorElRef.current = target
    setHoleRect(measureHole(target))
    setOpenIndex(index)
    setPlace(p)
  }, [disabled])

  const toggle = useCallback((index: number, target: HTMLElement) => {
    if (disabled || index < 0 || index >= annRef.current.length) return
    if (openIndexRef.current === index) {
      setOpenIndex(null)
      setPlace(null)
      setHoleRect(null)
      anchorElRef.current = null
      return
    }
    const p = calcPlace(target)
    if (!p) return
    anchorElRef.current = target
    setHoleRect(measureHole(target))
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

  useLayoutEffect(() => {
    if (openIndex === null) return
    syncHole()
    const id = requestAnimationFrame(() => syncHole())
    return () => cancelAnimationFrame(id)
  }, [openIndex, place, syncHole])

  useEffect(() => {
    if (openIndex === null) return
    const onResize = () => syncHole()
    window.addEventListener('resize', onResize)
    const ro =
      anchorElRef.current && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => syncHole())
        : null
    if (anchorElRef.current && ro) ro.observe(anchorElRef.current)
    return () => {
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
    }
  }, [openIndex, syncHole])

  const entry = openIndex !== null ? annRef.current[openIndex] : undefined
  const bodyText = entry?.body ?? ''
  const titleText = entry?.title?.trim() ? entry.title.trim() : t('post.annotations')
  const bubbleTone =
    openIndex !== null ? annotationTone(sanitizeAnnoIdPrefix(idPrefix), openIndex) : 0

  const holeStyle =
    holeRect && holeRect.width > 0 && holeRect.height > 0
      ? ({
          ['--anno-hole-x' as string]: `${holeRect.left}px`,
          ['--anno-hole-y' as string]: `${holeRect.top}px`,
          ['--anno-hole-w' as string]: `${holeRect.width}px`,
          ['--anno-hole-h' as string]: `${holeRect.height}px`,
        } as CSSProperties)
      : undefined

  const bubble =
    openIndex !== null && place !== null ? (
      <>
        <div className="anno-mobile-pop-backdrop" aria-hidden style={holeStyle} />
        <MobilePopHitStrips hole={holeRect} onClose={close} />
        <div
          id={`anno-mobile-pop-${uid}`}
          className={`anno-mobile-pop-card anno-mobile-wechat--tone-${bubbleTone}`}
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
