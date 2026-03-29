import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnnoBodyText } from './AnnoBodyText'
import { useI18n } from '../../i18n/I18nContext'
import type { MarkdownAnnotation } from '../../utils/annotationMarkdown'
import {
  annotationTone,
  marginCardJitter,
  marginCardWidthPx,
  packAnnotationTops,
  sanitizeAnnoIdPrefix,
} from '../../utils/annotationVariation'
import { NOTE_ID, TEXT_ID } from './AnnotationBridges'

const MQ_WIDE = '(min-width: 1101px)'
const ANNO_CARD_MIN_GAP_PX = 20
const ANNO_CARD_FALLBACK_HEIGHT_PX = 80

function queryInHost(root: HTMLElement | null, id: string): HTMLElement | null {
  if (!root) return document.getElementById(id)
  try {
    return root.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null
  } catch {
    return document.getElementById(id)
  }
}

type Props = {
  idPrefix: string
  annotations: MarkdownAnnotation[]
  annotationCardVisible?: boolean[]
  marginHidden?: boolean
  marginPortalHost?: HTMLElement | null
  children: ReactNode
}

function MarginLayer({
  annotations,
  idPrefix,
  tops,
  t,
  cardVisible,
}: {
  annotations: MarkdownAnnotation[]
  idPrefix: string
  tops: number[]
  t: (key: string) => string
  cardVisible: boolean[]
}) {
  return (
    <div className="post-annotation-margin-layer">
      {annotations.map((ann, i) => {
        const label = ann.title.trim() ? ann.title.trim() : t('post.annotations')
        const show = cardVisible[i] !== false
        const pid = sanitizeAnnoIdPrefix(idPrefix)
        const tone = annotationTone(pid, i)
        const jitter = marginCardJitter(pid, i)
        const cardW = marginCardWidthPx(pid, i)
        const wrapStyle: CSSProperties = {
          ['--anno-card-w' as string]: `${cardW}px`,
          top: tops[i] ?? 0,
          visibility: show ? 'visible' : 'hidden',
          pointerEvents: show ? undefined : 'none',
          transform: `translateX(${jitter.shiftPx.toFixed(2)}px) rotate(${jitter.rotateDeg.toFixed(3)}deg)`,
        }
        return (
          <div
            key={`${i}-${ann.anchorText.slice(0, 24)}`}
            className="post-annotation-margin-card-wrap post-annotation-margin-card-wrap--free"
            style={wrapStyle}
          >
            <div className="annotation-card glass-card">
              <button
                type="button"
                className={`anno-note anno-note--tip-card anno-note--tone-${tone}`}
                id={NOTE_ID(idPrefix, i)}
                style={{ borderRadius: `${jitter.radiusPx.toFixed(2)}px` }}
                data-anno-index={i}
                onClick={() =>
                  document.getElementById(TEXT_ID(idPrefix, i))?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  })
                }
              >
                <span className="anno-note__tip-label">{label}</span>
                <span className="anno-note__row">
                  <span className="anno-note__badge" aria-hidden="true">
                    {i + 1}
                  </span>
                  <AnnoBodyText text={ann.body} className="anno-note__text" />
                </span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PostAnnotationMarginRoot({
  idPrefix,
  annotations,
  annotationCardVisible,
  marginHidden = false,
  marginPortalHost,
  children,
}: Props) {
  const { t } = useI18n()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tops, setTops] = useState<number[]>([])
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MQ_WIDE).matches : false,
  )

  const portalMode = marginPortalHost !== undefined

  const measure = useCallback(() => {
    const root = portalMode ? marginPortalHost : wrapRef.current
    if (!root || !wide || annotations.length === 0) return
    const wr = root.getBoundingClientRect()
    const heights = annotations.map((_, i) => {
      const note = queryInHost(root, NOTE_ID(idPrefix, i))
      const wrap = note?.closest('.post-annotation-margin-card-wrap') as HTMLElement | null
      return wrap?.offsetHeight ?? 0
    })
    const rawTops = annotations.map((_, i) => {
      const el = queryInHost(root, TEXT_ID(idPrefix, i))
      if (!el) return 0
      const ar = el.getBoundingClientRect()
      const h = heights[i]! > 8 ? heights[i]! : ANNO_CARD_FALLBACK_HEIGHT_PX
      const anchorCenter = ar.top - wr.top + root.scrollTop + ar.height / 2
      const topUnclamped = anchorCenter - h / 2
      return Math.max(0, topUnclamped)
    })
    const next = packAnnotationTops(
      rawTops,
      heights,
      ANNO_CARD_MIN_GAP_PX,
      ANNO_CARD_FALLBACK_HEIGHT_PX,
    )
    setTops((prev) => (prev.length === next.length && prev.every((v, j) => v === next[j]) ? prev : next))
  }, [idPrefix, annotations, wide, portalMode, marginPortalHost])

  useLayoutEffect(() => {
    measure()
    const id = requestAnimationFrame(() => measure())
    return () => cancelAnimationFrame(id)
  }, [measure, annotations])

  useEffect(() => {
    const mq = window.matchMedia(MQ_WIDE)
    const onMq = () => setWide(mq.matches)
    mq.addEventListener('change', onMq)
    return () => mq.removeEventListener('change', onMq)
  }, [])

  useEffect(() => {
    if (!wide) return
    const ro = new ResizeObserver(() => measure())
    const root = portalMode ? marginPortalHost : wrapRef.current
    if (root) ro.observe(root)
    const inner = wrapRef.current
    if (inner && inner !== root) ro.observe(inner)
    window.addEventListener('resize', measure)
    const p = document.fonts?.ready?.then(measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      void p
    }
  }, [wide, measure, portalMode, marginPortalHost])

  const showMargin = wide && annotations.length > 0 && !marginHidden
  const portalActive = portalMode && marginPortalHost != null && showMargin
  const inlineActive = !portalMode && showMargin

  const cardVis =
    annotationCardVisible ??
    annotations.map(() => true)

  const layer =
    showMargin && (portalActive || inlineActive) ? (
      <MarginLayer
        annotations={annotations}
        idPrefix={idPrefix}
        tops={tops}
        t={t}
        cardVisible={cardVis}
      />
    ) : null

  return (
    <>
      {portalActive && marginPortalHost && layer
        ? createPortal(layer, marginPortalHost)
        : null}
      <div ref={wrapRef} className="post-md-anno-root">
        {inlineActive && layer}
        {children}
      </div>
    </>
  )
}
