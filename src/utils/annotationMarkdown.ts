import { annotationTone, sanitizeAnnoIdPrefix } from './annotationVariation'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const ANNO_START = '|{[('
/**
 * Inline annotation: `|{[(underlined text)]}tail|`
 * - `{[(…)]}` = the phrase that gets the underline in the article (may contain Markdown; rendered as plain in the anchor).
 * - `tail` = card label, or `title: body` (split on first `: `) for label + card Markdown.
 * Prefer **no** extra text before `|{[(` — avoid `|paragraph |{[(…)]}|` (legacy); that duplicated anchor vs card.
 * Legacy `)]}|tail|` (extra `|` before tail) still supported for GFM table quirks.
 */

/** Same rules as `isDottedI18nKey` in i18nKeys.ts (no import: i18nKeys imports this module). */
const I18N_KEY_SEGMENT = '(?:[a-z0-9][\\w-]*|[\\p{L}\\p{M}\\p{N}_\\-:：.（）]+)'
const DOTTED_I18N_KEY = new RegExp(
  `^(?:post|content)\\.${I18N_KEY_SEGMENT}(?:\\.${I18N_KEY_SEGMENT})*\\.?$`,
  'iu',
)

function isDottedKey(s: string): boolean {
  return DOTTED_I18N_KEY.test(s.trim())
}

function maybeTranslate(raw: string, translate?: (key: string) => string): string {
  if (!translate) return raw
  const trimmed = raw.trim()
  if (!trimmed) return raw
  if (!isDottedKey(trimmed)) return raw
  return translate(trimmed) || raw
}

/**
 * `|{[(highlight)]}tail|` (preferred) or legacy `|{[(highlight)]}|tail|`.
 * Optional id suffix: `...}标题:123|` — `123` is stripped for card fields; title label is `标题`.
 * If `tail` contains `: ` (colon + space), the part before is title and the part after is body.
 */
export function splitAnnotationTail(tail: string): { title: string; body: string } {
  const trimmed = tail.trim()
  if (!trimmed) return { title: '', body: '' }
  const idx = trimmed.indexOf(': ')
  if (idx === -1) return { title: '', body: trimmed }
  return {
    title: trimmed.slice(0, idx).trim(),
    body: trimmed.slice(idx + 2).trim(),
  }
}

/** Resolve card title/body: translate dotted keys; if the whole tail is one key, translate then split on `: `. */
export function parseCardFieldsFromTail(
  tail: string,
  translate?: (key: string) => string,
): { title: string; body: string } {
  const trimmed = tail.trim()
  if (!trimmed) return { title: '', body: '' }

  if (translate && isDottedKey(trimmed)) {
    return splitAnnotationTail(translate(trimmed) || trimmed)
  }

  const { title: t0, body: b0 } = splitAnnotationTail(trimmed)
  const title =
    t0 && translate && isDottedKey(t0.trim()) ? translate(t0.trim()) || t0 : t0
  const body =
    b0 && translate && isDottedKey(b0.trim()) ? translate(b0.trim()) || b0 : b0

  if (!t0 && !b0) {
    return { title: '', body: trimmed }
  }
  return { title, body }
}

export type MarkdownAnnotation = {
  /** Underlined text in the article body. */
  anchorText: string
  /** Card label (empty → UI default). */
  title: string
  /** Card main content (markdown). */
  body: string
}

/** @deprecated Line-based tools only; fails on `)` inside `{[(…)]}`. Prefer `parseAnnotationAt`. */
export const MARKDOWN_INLINE_ANNOTATION_PATTERN =
  /\|\{\[\(([\s\S]*?)\)\]\}\|?([^|]*)\|/g

const ANNO_PLACEHOLDER = (i: number) => `\u2060%%BLOG_ANNO_${i}%%\u2060`

export type ParsedInlineAnnotation = {
  full: string
  inner: string
  tail: string
  end: number
}

/**
 * Find the closing `|` for an annotation row tail:
 * - Same line: last `|` on that line with only whitespace after (tail must not contain other `|`).
 * - GFM: optional line that is only whitespace + `|`.
 * - Multi-line tail: later lines until a line whose last `|` has only whitespace after it.
 */
function findAnnotationRowClosingPipe(source: string, tailStart: number): number {
  const lineEnd = source.indexOf('\n', tailStart)
  const limit = lineEnd === -1 ? source.length : lineEnd
  const firstLine = source.slice(tailStart, limit)
  const rel0 = firstLine.lastIndexOf('|')
  if (rel0 !== -1 && /^\s*$/.test(firstLine.slice(rel0 + 1))) {
    return tailStart + rel0
  }

  if (lineEnd === -1) {
    const idx = source.indexOf('|', tailStart)
    return idx === -1 ? -1 : idx
  }

  const after = source.slice(lineEnd + 1)
  const m = after.match(/^(\s*)\|\s*(?:\r?\n|$)/)
  if (m) return lineEnd + 1 + m[1]!.length

  let searchFrom = lineEnd + 1
  while (searchFrom < source.length) {
    const nl = source.indexOf('\n', searchFrom)
    const lineEndIdx = nl === -1 ? source.length : nl
    const line = source.slice(searchFrom, lineEndIdx)
    const rel = line.lastIndexOf('|')
    if (rel !== -1 && /^\s*$/.test(line.slice(rel + 1))) {
      return searchFrom + rel
    }
    if (nl === -1) break
    searchFrom = nl + 1
  }
  return -1
}

/**
 * Single source of truth for one `|{[(…)]}tail|` row. Ends immediately after the closing `|`.
 * Supports empty tail: `|{[(x)]}|` (closing pipe is the one right after `]}`).
 */
export function parseAnnotationAt(source: string, at: number): ParsedInlineAnnotation | null {
  return scanAnnotationRow(source, at)
}

export function scanAnnotationRow(source: string, at: number): ParsedInlineAnnotation | null {
  if (!source.startsWith(ANNO_START, at)) return null
  let i = at + ANNO_START.length
  if (i >= source.length) return null
  let depth = 1
  const innerStart = i
  while (i < source.length && depth > 0) {
    const c = source[i]!
    if (c === '(') depth++
    else if (c === ')') depth--
    i++
  }
  if (depth !== 0) return null
  const inner = source.slice(innerStart, i - 1)
  if (source[i] !== ']' || source[i + 1] !== '}') return null
  i += 2

  if (source[i] !== '|') {
    const tailStart = i
    const pipeAt = findAnnotationRowClosingPipe(source, tailStart)
    if (pipeAt === -1) return null
    let tail = source.slice(tailStart, pipeAt)
    const idSuffix = tail.match(/^(.*):(\d+)$/)
    if (idSuffix) tail = idSuffix[1]!.trimEnd()
    return { full: source.slice(at, pipeAt + 1), inner, tail, end: pipeAt + 1 }
  }

  const afterBrace = i + 1
  const lineEnd = source.indexOf('\n', afterBrace)
  const eol = lineEnd === -1 ? source.length : lineEnd
  const onlyWsToEol = /^\s*$/.test(source.slice(afterBrace, eol))

  if (onlyWsToEol) {
    return { full: source.slice(at, afterBrace), inner, tail: '', end: afterBrace }
  }

  i = afterBrace
  const tailStart = i
  const pipeAt = findAnnotationRowClosingPipe(source, tailStart)
  if (pipeAt === -1) return null
  let tail = source.slice(tailStart, pipeAt)
  const idSuffix = tail.match(/^(.*):(\d+)$/)
  if (idSuffix) {
    tail = idSuffix[1]!.trimEnd()
  }
  return { full: source.slice(at, pipeAt + 1), inner, tail, end: pipeAt + 1 }
}

/** Strips annotations for i18n expansion; restores with the same indices as `annoSlices`. */
export function maskMarkdownAnnotations(source: string): { masked: string; slices: string[] } {
  const slices: string[] = []
  let out = ''
  let pos = 0
  while (pos < source.length) {
    const idx = source.indexOf(ANNO_START, pos)
    if (idx === -1) {
      out += source.slice(pos)
      break
    }
    out += source.slice(pos, idx)
    const parsed = parseAnnotationAt(source, idx)
    if (!parsed) {
      out += source[idx]!
      pos = idx + 1
      continue
    }
    const i = slices.length
    slices.push(parsed.full)
    // `parsed.full` is `|{[(…)]}tail|` — the leading `|` is inside the replaced range. Emit a full
    // table-shaped row `|%%…%%|` so i18n + restore never leave bare `{[(post…` lines.
    out += '|' + ANNO_PLACEHOLDER(i) + '|'
    pos = parsed.end
  }
  return { masked: out, slices }
}

/** GFM treats `|...|` as a table row; unwrap lines that are only `| … md-anno … |`. */
function unwrapAnnotationTableRowLines(body: string): string {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim()
      if (t.includes('md-anno-row')) {
        if (t.startsWith('|') && t.endsWith('|')) {
          return t.slice(1, -1).trim()
        }
        return t
      }
      if (!t.startsWith('|') || !t.endsWith('|')) return line
      if (!t.includes('md-anno')) return line
      const inner = t.slice(1, -1)
      return inner.trim()
    })
    .join('\n')
}

function replaceAnnotationsInSegment(
  text: string,
  annotations: MarkdownAnnotation[],
  idPrefix: string,
  nextIndex: { n: number },
  translate?: (key: string) => string,
): string {
  let out = ''
  let pos = 0
  while (pos < text.length) {
    const idx = text.indexOf(ANNO_START, pos)
    if (idx === -1) {
      out += text.slice(pos)
      break
    }
    out += text.slice(pos, idx)
    const parsed = parseAnnotationAt(text, idx)
    if (!parsed) {
      out += text[idx]!
      pos = idx + 1
      continue
    }
    const anchorText = maybeTranslate(parsed.inner.trim(), translate)
    const { title, body } = parseCardFieldsFromTail(parsed.tail, translate)
    const i = nextIndex.n++
    annotations.push({ anchorText, title, body })
    const badge = i + 1
    const tone = annotationTone(idPrefix, i)
    // Outer span (block via CSS) avoids GFM `|…|` table rows and callout-splitter eating `<div>…</div>`.
    out += `<span class="md-anno-row"><span class="md-anno" data-anno-index="${i}" data-anno-tone="${tone}" id="BLOG-anno-text-${idPrefix}-${i}"><span class="md-anno__badge" aria-hidden="true">${badge}</span> ${escapeHtml(anchorText)}</span></span>`
    pos = parsed.end
  }
  return out
}

function stripAnnotationsInSegment(text: string): string {
  let out = ''
  let pos = 0
  while (pos < text.length) {
    const idx = text.indexOf(ANNO_START, pos)
    if (idx === -1) {
      out += text.slice(pos)
      break
    }
    out += text.slice(pos, idx)
    const parsed = parseAnnotationAt(text, idx)
    if (!parsed) {
      out += text[idx]!
      pos = idx + 1
      continue
    }
    out += parsed.inner.trim()
    pos = parsed.end
  }
  return out
}

/** After i18n `split('|')` rebuild, `|anchor||{[(` or `|anchor| |{[(` can appear; normalize for `parseAnnotationAt`. */
function normalizeAnnotationDoublePipe(s: string): string {
  return s.replace(/\|\s*\|{[\[]\(/g, '|{[(')
}

/** Trailing `||` from pipe+restore glitches breaks `parseAnnotationAt` closing `|`. */
function normalizeTrailingDoublePipe(s: string): string {
  return s.replace(/\|\|(\s*)$/gm, '|$1')
}

/**
 * GFM/table parsing sometimes drops the leading `|` so `{[(post…` appears without `|{[(`;
 * `parseAnnotationAt` then never runs and raw `{[(keys)]}` shows in the article.
 */
function repairBrokenAnnotationChunk(chunk: string): string {
  return chunk.replace(/(?<!\|)(\{[\[]\(\s*(?:post|content)\.)/g, '|$1')
}

/**
 * After `|` that closes a table cell, the next annotation may start with `{[(…` without a second `|`
 * (e.g. `…title|{[(post…`); the lookbehind repair does not apply because `{` is preceded by `|`.
 */
function repairAnnotationAfterCellPipe(chunk: string): string {
  return chunk.replace(/(\|)(\{[\[]\(\s*(?:post|content)\.)/g, '$1|$2')
}

/**
 * Line-start (after optional indent) bare `{[(post|content.…` — not matched by `(?<!\|)` when column pipes touch.
 */
function ensureBareLineStartAnnotationPipe(chunk: string): string {
  return chunk.replace(/(^|\n)([ \t]*)(\{[\[]\(\s*(?:post|content)\.)/g, '$1$2|$3')
}

/**
 * Row must end with `|` for `parseAnnotationAt`. GFM occasionally splits the last `|` to its own line.
 */
function mergeOrphanClosingPipeLines(chunk: string): string {
  return chunk.replace(
    /(\{[\[]\([^)]*\)\]\}(?:post|content)\.[^\s|\n]+)\s*\r?\n\s*\|\s*$/gm,
    '$1|',
  )
}

/**
 * Same-line missing closing `|` after `)]}post…` / `)]}content…` tails.
 */
function repairMissingClosingPipeForAnnotations(chunk: string): string {
  return chunk
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trimEnd()
      if (trimmed.endsWith('|')) return line
      if (!/\{[\[]\([^)]*\)\]\}/.test(trimmed)) return line
      if (!/\)\]\}(?:post|content)\.[^\s|]+$/i.test(trimmed)) return line
      if (/^\s{4,}/.test(line) && !line.includes('|{[(')) return line
      return `${line}|`
    })
    .join('\n')
}

function mapMarkdownOutsideCodeFences(source: string, mapChunk: (s: string) => string): string {
  const out: string[] = []
  let pos = 0
  while (pos < source.length) {
    const fenceStart = source.indexOf('```', pos)
    if (fenceStart === -1) {
      out.push(mapChunk(source.slice(pos)))
      break
    }
    if (fenceStart > pos) {
      out.push(mapChunk(source.slice(pos, fenceStart)))
    }
    const afterTicks = fenceStart + 3
    const firstNl = source.indexOf('\n', afterTicks)
    if (firstNl === -1) {
      out.push(source.slice(fenceStart))
      break
    }
    let lineStart = firstNl + 1
    let closeEnd = -1
    while (lineStart < source.length) {
      const lineEnd = source.indexOf('\n', lineStart)
      const line = lineEnd === -1 ? source.slice(lineStart) : source.slice(lineStart, lineEnd)
      if (line.trim() === '```') {
        closeEnd = lineEnd === -1 ? source.length : lineEnd + 1
        break
      }
      if (lineEnd === -1) break
      lineStart = lineEnd + 1
    }
    if (closeEnd === -1) {
      out.push(source.slice(fenceStart))
      break
    }
    out.push(source.slice(fenceStart, closeEnd))
    pos = closeEnd
  }
  return out.join('')
}

/** Run before mask/expand so `|{[(` survives GFM quirks; skips fenced code. */
export function preNormalizeAnnotationMarkdown(source: string): string {
  return mapMarkdownOutsideCodeFences(source, (chunk) =>
    normalizeTrailingDoublePipe(
      normalizeAnnotationDoublePipe(
        repairMissingClosingPipeForAnnotations(
          mergeOrphanClosingPipeLines(
            ensureBareLineStartAnnotationPipe(
              repairAnnotationAfterCellPipe(repairBrokenAnnotationChunk(chunk)),
            ),
          ),
        ),
      ),
    ),
  )
}

export function preprocessMarkdownAnnotations(
  source: string,
  options?: { idPrefix?: string; translate?: (key: string) => string },
): {
  body: string
  annotations: MarkdownAnnotation[]
} {
  const idPrefix = sanitizeAnnoIdPrefix(options?.idPrefix ?? 'p')
  const translate = options?.translate
  const annotations: MarkdownAnnotation[] = []
  const nextIndex = { n: 0 }
  const out: string[] = []
  let pos = 0
  source = preNormalizeAnnotationMarkdown(source)

  while (pos < source.length) {
    const fenceStart = source.indexOf('```', pos)
    if (fenceStart === -1) {
      out.push(replaceAnnotationsInSegment(source.slice(pos), annotations, idPrefix, nextIndex, translate))
      break
    }
    if (fenceStart > pos) {
      out.push(
        replaceAnnotationsInSegment(
          source.slice(pos, fenceStart),
          annotations,
          idPrefix,
          nextIndex,
          translate,
        ),
      )
    }
    const afterTicks = fenceStart + 3
    const firstNl = source.indexOf('\n', afterTicks)
    if (firstNl === -1) {
      out.push(source.slice(fenceStart))
      break
    }
    let lineStart = firstNl + 1
    let closeEnd = -1
    while (lineStart < source.length) {
      const lineEnd = source.indexOf('\n', lineStart)
      const line = lineEnd === -1 ? source.slice(lineStart) : source.slice(lineStart, lineEnd)
      if (line.trim() === '```') {
        closeEnd = lineEnd === -1 ? source.length : lineEnd + 1
        break
      }
      if (lineEnd === -1) break
      lineStart = lineEnd + 1
    }
    if (closeEnd === -1) {
      out.push(source.slice(fenceStart))
      break
    }
    out.push(source.slice(fenceStart, closeEnd))
    pos = closeEnd
  }

  return { body: unwrapAnnotationTableRowLines(out.join('')), annotations }
}

export function stripMarkdownAnnotations(source: string): string {
  const out: string[] = []
  let pos = 0

  while (pos < source.length) {
    const fenceStart = source.indexOf('```', pos)
    if (fenceStart === -1) {
      out.push(stripAnnotationsInSegment(source.slice(pos)))
      break
    }
    if (fenceStart > pos) {
      out.push(stripAnnotationsInSegment(source.slice(pos, fenceStart)))
    }
    const afterTicks = fenceStart + 3
    const firstNl = source.indexOf('\n', afterTicks)
    if (firstNl === -1) {
      out.push(source.slice(fenceStart))
      break
    }
    let lineStart = firstNl + 1
    let closeEnd = -1
    while (lineStart < source.length) {
      const lineEnd = source.indexOf('\n', lineStart)
      const line = lineEnd === -1 ? source.slice(lineStart) : source.slice(lineStart, lineEnd)
      if (line.trim() === '```') {
        closeEnd = lineEnd === -1 ? source.length : lineEnd + 1
        break
      }
      if (lineEnd === -1) break
      lineStart = lineEnd + 1
    }
    if (closeEnd === -1) {
      out.push(source.slice(fenceStart))
      break
    }
    out.push(source.slice(fenceStart, closeEnd))
    pos = closeEnd
  }

  return out.join('')
}
