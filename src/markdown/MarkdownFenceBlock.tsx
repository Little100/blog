import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { parseTree, type ParseError } from 'jsonc-parser'
import { useTheme } from '../theme/ThemeContext'
import { useI18n } from '../i18n/I18nContext'
import { jsonParseErrorMessage } from '../i18n/jsonParseErrorMessages'
import { codeToHtml, type BlogShikiTheme } from '../shiki/blogHighlighter'
import { wrapTextRangeInElement } from '../utils/wrapTextRangeInElement'
import { MdInsidePreProvider } from './MdPreContext'
import { resolveFenceLang } from './fenceLang'
import { Copy, FileText } from 'lucide-react'
import { FenceLangIcon } from './FenceLangIcon'
import type { Locale } from '../i18n/translations'

type PreProps = ComponentProps<'pre'> & { node?: unknown }

export type JsonDiagSlice = {
  offset: number
  length: number
  /** 1-based line number for the error position (after range clamp). */
  line: number
  message: string
}

/** 1-based line number for a 0-based character offset in `raw`. */
function lineNumberAtOffset(raw: string, offset: number): number {
  const max = Math.min(Math.max(0, offset), raw.length)
  let line = 1
  for (let i = 0; i < max; i++) {
    if (raw[i] === '\n') line++
  }
  return line
}

function formatJsonDiagLine(t: (key: string) => string, d: JsonDiagSlice): string {
  return t('post.codeFence.linePrefix').replace('{line}', String(d.line)) + d.message
}

function stringifyCodeChildren(node: ReactNode): string {
  if (node == null || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(stringifyCodeChildren).join('')
  if (isValidElement(node)) {
    const p = node.props as { children?: ReactNode }
    if (p.children !== undefined) return stringifyCodeChildren(p.children)
  }
  return ''
}

/** Clamp a jsonc-parser error range; snap offset off trailing whitespace so squiggle is visible. */
function clampJsonDiagRange(
  raw: string,
  offset: number,
  length: number,
): { offset: number; length: number } | null {
  const n = raw.length
  if (n === 0) return null

  let o = offset
  let len = Math.max(1, length)

  while (o > 0 && /\s/.test(raw[o] ?? '')) {
    o--
    len = 1
  }

  if (o < 0) o = 0
  if (o >= n) o = Math.max(0, n - 1)
  if (o + len > n) len = Math.max(1, n - o)

  return { offset: o, length: len }
}

function jsonDiagnostics(
  raw: string,
  shikiLang: string,
  locale: Locale,
): JsonDiagSlice[] | null {
  if (shikiLang !== 'json' && shikiLang !== 'jsonc') return null
  const errors: ParseError[] = []
  parseTree(raw, errors)
  if (errors.length === 0) return null

  const slices: JsonDiagSlice[] = []
  for (const e of errors) {
    const range = clampJsonDiagRange(raw, e.offset, e.length)
    if (!range) continue
    slices.push({
      offset: range.offset,
      length: range.length,
      line: lineNumberAtOffset(raw, range.offset),
      message: jsonParseErrorMessage(locale, e.error as number),
    })
  }
  if (slices.length === 0) return null
  return slices
}

function PlainFencePre({ rawText }: { rawText: string }) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const { t } = useI18n()

  const copy = useCallback(async () => {
    const raw = preRef.current?.innerText ?? ''
    try {
      await navigator.clipboard.writeText(raw.endsWith('\n') ? raw.slice(0, -1) : raw)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [])

  return (
    <div className="md-pre-wrap md-pre-wrap--shiki md-pre-wrap--plain" translate="no">
      <div className="md-pre-toolbar">
        <span className="md-pre-window-dots" aria-hidden="true" />
        <div className="md-pre-toolbar-leading">
          <span className="md-pre-lang-row">
            <FileText aria-hidden className="md-pre-lang-icon" size={14} strokeWidth={2} />
            <span className="md-pre-lang">Text</span>
          </span>
        </div>
        <button
          type="button"
          className="md-pre-copy"
          onClick={copy}
          aria-label={t('post.copyCode')}
        >
          <Copy className="md-pre-copy__icon" size={14} strokeWidth={2} aria-hidden />
          <span>{copied ? t('post.copied') : t('post.copyCode')}</span>
        </button>
      </div>
      <pre ref={preRef} className="md-pre">
        <MdInsidePreProvider>
          <code className="md-code--block">{rawText}</code>
        </MdInsidePreProvider>
      </pre>
    </div>
  )
}

function usePointerCoarse(): boolean {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const apply = () => setCoarse(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return coarse
}

function ShikiFenceBody({
  rawText,
  shikiLang,
  label,
  shikiTheme,
  diags,
}: {
  rawText: string
  shikiLang: string
  label: string
  shikiTheme: BlogShikiTheme
  diags: JsonDiagSlice[] | null
}) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const diagListId = useId()
  const errorsPanelDomId = useId()
  const hostRef = useRef<HTMLDivElement>(null)
  const errorCountBtnRef = useRef<HTMLButtonElement>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const coarse = usePointerCoarse()
  const [tipOpen, setTipOpen] = useState(false)
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null)
  const [errorsOpen, setErrorsOpen] = useState(false)
  const [errorsPanelPos, setErrorsPanelPos] = useState<{ top: number; left: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const diagAnchorRef = useRef<HTMLElement | null>(null)
  const hoverCloseTimerRef = useRef<number | null>(null)

  const primaryDiag = diags?.[0] ?? null

  const clearHoverCloseTimer = useCallback(() => {
    const id = hoverCloseTimerRef.current
    if (id != null) {
      window.clearTimeout(id)
      hoverCloseTimerRef.current = null
    }
  }, [])

  const positionTipFromAnchor = useCallback(() => {
    const el = diagAnchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setTipPos({ top: r.bottom + 6, left: r.left })
  }, [])

  const positionErrorsPanel = useCallback(() => {
    const el = errorCountBtnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const maxW = Math.min(320, window.innerWidth - 16)
    let left = r.left
    if (left + maxW > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - 8 - maxW)
    }
    setErrorsPanelPos({ top: r.bottom + 6, left })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const out = await codeToHtml(rawText, {
          lang: shikiLang as never,
          theme: shikiTheme,
          structure: 'classic',
        })
        if (!cancelled) setHtml(out)
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : 'Highlight failed')
          setHtml(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [rawText, shikiLang, shikiTheme])

  useLayoutEffect(() => {
    clearHoverCloseTimer()
    setTipOpen(false)
    setTipPos(null)
    diagAnchorRef.current = null
    const host = hostRef.current
    if (!host || !html) return

    host.innerHTML = html
    const preEl = host.querySelector('pre')
    if (preEl) {
      preEl.style.removeProperty('background-color')
    }

    if (!diags?.length) return

    const pre = host.querySelector('pre')
    const inner = (pre ?? host) as HTMLElement

    const indexed = diags.map((d, i) => ({ ...d, i }))
    const sorted = [...indexed].sort((a, b) => b.offset - a.offset)

    let primaryWrap: HTMLElement | null = null
    for (const item of sorted) {
      const wrap = document.createElement('span')
      wrap.className = 'md-code-diag-squiggle'
      wrap.setAttribute('aria-describedby', diagListId)
      const ok = wrapTextRangeInElement(inner, item.offset, item.offset + item.length, wrap)
      if (!ok) continue
      if (item.i === 0) primaryWrap = wrap
    }

    diagAnchorRef.current = primaryWrap

    if (!primaryWrap) return

    const scheduleHoverClose = () => {
      clearHoverCloseTimer()
      hoverCloseTimerRef.current = window.setTimeout(() => {
        setTipOpen(false)
        setTipPos(null)
        hoverCloseTimerRef.current = null
      }, 140)
    }

    if (coarse) {
      const onDiagClick = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        const r = primaryWrap!.getBoundingClientRect()
        setTipPos({ top: r.bottom + 6, left: r.left })
        setTipOpen((v) => !v)
      }
      primaryWrap.addEventListener('click', onDiagClick)
      return () => {
        primaryWrap.removeEventListener('click', onDiagClick)
        clearHoverCloseTimer()
      }
    }

    const onEnter = () => {
      clearHoverCloseTimer()
      const r = primaryWrap!.getBoundingClientRect()
      setTipPos({ top: r.bottom + 6, left: r.left })
      setTipOpen(true)
    }
    const onLeave = () => {
      scheduleHoverClose()
    }
    primaryWrap.addEventListener('mouseenter', onEnter)
    primaryWrap.addEventListener('mouseleave', onLeave)
    return () => {
      primaryWrap.removeEventListener('mouseenter', onEnter)
      primaryWrap.removeEventListener('mouseleave', onLeave)
      clearHoverCloseTimer()
    }
  }, [html, diags, coarse, clearHoverCloseTimer, diagListId])

  useEffect(() => {
    if (!tipOpen) return
    const onScrollOrResize = () => {
      positionTipFromAnchor()
    }
    positionTipFromAnchor()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [tipOpen, positionTipFromAnchor])

  useEffect(() => {
    if (!tipOpen || !coarse) return
    const close = () => setTipOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [tipOpen, coarse])

  useEffect(() => {
    if (!errorsOpen) return
    positionErrorsPanel()
    const onScrollOrResize = () => positionErrorsPanel()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [errorsOpen, positionErrorsPanel])

  useEffect(() => {
    if (!errorsOpen) return
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (errorCountBtnRef.current?.contains(t)) return
      const panel = document.getElementById(errorsPanelDomId)
      if (panel?.contains(t)) return
      setErrorsOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [errorsOpen, errorsPanelDomId])

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(rawText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [rawText])

  const errorCountLabel =
    diags && diags.length > 0
      ? t('post.codeFence.errorCount').replace('{n}', String(diags.length))
      : ''

  const toggleErrorsPanel = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setErrorsOpen((v) => !v)
    },
    [],
  )

  return (
    <div className="md-pre-wrap md-pre-wrap--shiki" translate="no">
      {diags && diags.length > 0 ? (
        <div id={diagListId} className="sr-only">
          <p>{t('post.codeFence.errorsTitle')}</p>
          <ol>
            {diags.map((d, i) => (
              <li key={i}>{formatJsonDiagLine(t, d)}</li>
            ))}
          </ol>
        </div>
      ) : null}
      <div className="md-pre-toolbar">
        <span className="md-pre-window-dots" aria-hidden="true" />
        <div className="md-pre-toolbar-leading">
          <span className="md-pre-lang-row">
            <FenceLangIcon lang={shikiLang} className="md-pre-lang-icon" />
            <span className="md-pre-lang">{label}</span>
          </span>
          {diags && diags.length > 0 ? (
            <button
              ref={errorCountBtnRef}
              type="button"
              className="md-pre-error-count"
              onClick={toggleErrorsPanel}
              aria-expanded={errorsOpen}
              aria-controls={errorsOpen ? errorsPanelDomId : undefined}
              aria-label={errorCountLabel}
            >
              {errorCountLabel}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="md-pre-copy"
          onClick={copy}
          aria-label={t('post.copyCode')}
        >
          <Copy className="md-pre-copy__icon" size={14} strokeWidth={2} aria-hidden />
          <span>{copied ? t('post.copied') : t('post.copyCode')}</span>
        </button>
      </div>
      {loadErr ? (
        <pre className="md-pre">
          <code className="md-code--block">{rawText}</code>
        </pre>
      ) : !html ? (
        <pre className="md-pre md-pre-shiki-pending">
          <code className="md-code--block">{rawText}</code>
        </pre>
      ) : (
        <div ref={hostRef} className="md-pre-shiki-host" />
      )}
      {primaryDiag && tipOpen && tipPos &&
        createPortal(
          <div
            className="md-code-diag-popover"
            role="tooltip"
            style={{ top: tipPos.top, left: tipPos.left }}
            onMouseEnter={() => {
              if (!coarse) clearHoverCloseTimer()
            }}
            onMouseLeave={() => {
              if (!coarse) {
                clearHoverCloseTimer()
                hoverCloseTimerRef.current = window.setTimeout(() => {
                  setTipOpen(false)
                  setTipPos(null)
                }, 140)
              }
            }}
            onPointerDown={(e) => {
              if (coarse) e.stopPropagation()
            }}
          >
            {formatJsonDiagLine(t, primaryDiag)}
            {diags && diags.length > 1 ? (
              <span className="md-code-diag-popover__more">
                {' '}
                (+{diags.length - 1})
              </span>
            ) : null}
          </div>,
          document.body,
        )}
      {createPortal(
        <AnimatePresence>
          {errorsOpen && errorsPanelPos && diags && diags.length > 0 ? (
            <motion.div
              key={errorsPanelDomId}
              id={errorsPanelDomId}
              className="md-code-errors-panel"
              role="dialog"
              aria-label={t('post.codeFence.errorsTitle')}
              style={{ top: errorsPanelPos.top, left: errorsPanelPos.left }}
              initial={
                reduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -6, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4, scale: 0.98 }}
              transition={{
                duration: reduceMotion ? 0 : 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="md-code-errors-panel__title">{t('post.codeFence.errorsTitle')}</div>
              <ol className="md-code-errors-panel__list">
                {diags.map((d, i) => (
                  <li key={i} className="md-code-errors-panel__item">
                    {formatJsonDiagLine(t, d)}
                  </li>
                ))}
              </ol>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

export function MarkdownFenceBlock(props: PreProps) {
  const { children, className, node: _n, ..._rest } = props
  void _n
  void className
  void _rest

  const { theme } = useTheme()
  const { locale } = useI18n()
  const shikiTheme: BlogShikiTheme = theme === 'dark' ? 'github-dark' : 'github-light'

  const child = Children.only(children) as React.ReactElement<{
    className?: string
    children?: ReactNode
  }>
  const codeClass = child.props.className ?? ''
  const m = codeClass.match(/language-([\w-+#]+)/)
  const rawTag = m ? m[1] : null
  const rawText = stringifyCodeChildren(child.props.children)

  const diags = useMemo(() => {
    if (!rawTag) return null
    return jsonDiagnostics(rawText, resolveFenceLang(rawTag).shiki, locale)
  }, [rawTag, rawText, locale])

  if (!rawTag) {
    return <PlainFencePre rawText={rawText} />
  }

  const { shiki: shikiLang, label } = resolveFenceLang(rawTag)

  return (
    <ShikiFenceBody
      rawText={rawText}
      shikiLang={shikiLang}
      label={label}
      shikiTheme={shikiTheme}
      diags={diags}
    />
  )
}
