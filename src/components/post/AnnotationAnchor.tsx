import {
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
} from 'react'
import { AnnotationBubbleCtx } from './AnnotationBubbleCtx'

type Props = Omit<ComponentProps<'span'>, 'className'> & {
  className?: string
  'data-anno-index'?: string
  'data-anno-tone'?: string
}

const ANNO_PATTERNS: Record<number, string> = {
  0: 'md-anno--tone-0',
  1: 'md-anno--tone-1',
  2: 'md-anno--tone-2',
  3: 'md-anno--tone-3',
}

function usePrimaryPointerCoarse(): boolean {
  const [coarse, setCoarse] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const sync = () => setCoarse(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return coarse
}

export function AnnotationAnchor({
  'data-anno-index': rawIndex,
  'data-anno-tone': rawTone,
  className = '',
  children,
  onPointerDown: userPointerDown,
  onClick: userClick,
  ...rest
}: Props) {
  const bubble = useContext(AnnotationBubbleCtx)
  const coarsePointer = usePrimaryPointerCoarse()

  const index = Number(rawIndex)
  const toneNum = Number(rawTone)
  const toneIdx =
    rawTone !== undefined && rawTone !== '' && Number.isFinite(toneNum)
      ? Math.max(0, Math.min(3, toneNum))
      : index % 4
  const toneClass = ANNO_PATTERNS[toneIdx] ?? ANNO_PATTERNS[0]

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (rawIndex && coarsePointer) {
        e.preventDefault()
        bubble?.toggle(Number(rawIndex), e.currentTarget)
      }
      userClick?.(e)
    },
    [bubble, coarsePointer, rawIndex, userClick],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (rawIndex && coarsePointer) e.preventDefault()
    },
    [coarsePointer, rawIndex],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      userPointerDown?.(e)
    },
    [userPointerDown],
  )

  if (!rawIndex) return <span className={className}>{children}</span>

  return (
    <span
      {...rest}
      className={`md-anno ${toneClass} ${className}`.trim()}
      data-anno-index={rawIndex}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
    >
      {children}
    </span>
  )
}
