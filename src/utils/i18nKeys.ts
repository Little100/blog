import {
  maskMarkdownAnnotations,
  parseAnnotationAt,
  preNormalizeAnnotationMarkdown,
} from './annotationMarkdown'

const ANNO_MASK_MARKER = /%%BLOG_ANNO_\d+%%/

function normalizePipeBeforeAnno(s: string): string {
  return s.replace(/\|\s*\|{[\[]\(/g, '|{[(')
}

function normalizeTrailingDoublePipe(s: string): string {
  return s.replace(/\|\|(\s*)$/gm, '|$1')
}


/**
 * Matches i18n keys emitted by sync-post-i18n (slugify): ASCII slugs plus CJK-only
 * section/tag tails like `section.多行批注`, `tag.功能`.
 * Keep in sync with `DOTTED_KEY` in scripts/sync-post-i18n.mjs and
 * `DOTTED_I18N_KEY` in annotationMarkdown.ts.
 */
/** CJK 等片段中允许全角/半角冒号与全角括号（如 `无语言标签（裸围栏）`），ASCII 片段不允许含点。 */
const I18N_KEY_SEGMENT = '(?:[a-z0-9][\\w-]*|[\\p{L}\\p{M}\\p{N}_\\-:：.（）]+)'
/** Optional trailing `.` matches sync slugify tails like `section....带红色波浪线.` */
const DOTTED_KEY_BODY = `(?:post|content)\\.${I18N_KEY_SEGMENT}(?:\\.${I18N_KEY_SEGMENT})*\\.?`
const DOTTED_KEY = new RegExp(`^${DOTTED_KEY_BODY}$`, 'iu')

function annoPlaceholder(i: number) {
  return `\u2060%%BLOG_ANNO_${i}%%\u2060`
}

export function isDottedI18nKey(s: string): boolean {
  return DOTTED_KEY.test(s.trim())
}

export function resolveTagLabel(
  tag: string,
  translate: (key: string) => string,
): string {
  const s = tag.trim()
  if (!s) return s
  return isDottedI18nKey(s) ? translate(s) : s
}

const IMG_ALT_KEY = new RegExp(`!\\[(${DOTTED_KEY_BODY})\\]\\(([^)\\s]+)\\)`, 'gi')

const LINE_KEY_ONLY = new RegExp(`^[\\t ]*(${DOTTED_KEY_BODY})[\\t ]*$`, 'iu')

const HEADING_KEY = new RegExp(`^(#{1,6})[\\t ]+(${DOTTED_KEY_BODY})[\\t ]*$`, 'iu')

const BLOCKQUOTE_KEY_ONLY = new RegExp(`^([\\t ]*>\\s*)(${DOTTED_KEY_BODY})[\\t ]*$`, 'iu')

const OL_ITEM_KEY = new RegExp(`^([\\t ]*\\d+\\.\\s+)(${DOTTED_KEY_BODY})[\\t ]*$`, 'iu')

const UL_ITEM_KEY = new RegExp(`^([\\t ]*[-*]\\s+)(${DOTTED_KEY_BODY})[\\t ]*$`, 'iu')

export function expandMarkdownI18nKeys(
  source: string,
  translate: (key: string) => string,
): string {
  source = preNormalizeAnnotationMarkdown(source)
  const { masked: withoutAnno, slices: annoSlices } = maskMarkdownAnnotations(source)

  const withAlt = withoutAnno.replace(IMG_ALT_KEY, (full, key: string, url: string) => {
    if (!isDottedI18nKey(key)) return full
    const alt = translate(key.trim())
    return `![${alt}](${url})`
  })

  const lines = withAlt.split(/\r?\n/)
  let inFence = false
  const out: string[] = []

  let lineIdx = 0
  while (lineIdx < lines.length) {
    let line = lines[lineIdx]!
    let advanceBy = 1
    if (!inFence && (line.includes('|{[(') || /\{[\[]\(\s*(?:post|content)\./.test(line))) {
      let buf = line
      let j = lineIdx
      let merged: string | null = null
      while (true) {
        const prepared = preNormalizeAnnotationMarkdown(buf)
        const at = prepared.indexOf('|{[(')
        if (at === -1) break
        if (parseAnnotationAt(prepared, at)) {
          merged = prepared
          break
        }
        j++
        if (j >= lines.length) break
        buf += '\n' + lines[j]!
      }
      if (merged !== null) {
        line = merged
      } else if (j > lineIdx) {
        line = preNormalizeAnnotationMarkdown(buf)
      }
      advanceBy = j - lineIdx + 1
    }
    lineIdx += advanceBy

    const trimmedStart = line.trimStart()
    if (trimmedStart.startsWith('```')) {
      inFence = !inFence
      out.push(line)
      continue
    }
    /* 围栏内保持源码字面量，不做 i18n（避免切换语言时代码块内容被翻译） */
    if (inFence) {
      out.push(line)
      continue
    }

    const processedLine = line.replace(
      new RegExp(`\\btitle:(${DOTTED_KEY_BODY})(?=\\s|>)`, 'giu'),
      (_m: string, key: string) => `title:${translate(key)}`,
    )

    if (!inFence && ANNO_MASK_MARKER.test(processedLine)) {
      out.push(processedLine)
      continue
    }

    const trimmedLine = processedLine.trim()
    if (!trimmedLine) {
      out.push(processedLine)
      continue
    }
    if (
      trimmedLine.startsWith('![') &&
      !trimmedLine.includes('|')
    ) {
      out.push(processedLine)
      continue
    }
    if (/^\[[^\]]+\]\([^)]+\)\s*$/.test(trimmedLine)) {
      out.push(processedLine)
      continue
    }
    if (/^\|.*\|\s*$/.test(trimmedLine) && trimmedLine.includes('|')) {
      const parts = processedLine.split('|')
      const anyKey = parts.some((seg: string) => isDottedI18nKey(seg.trim()))
      if (anyKey) {
        const rebuilt = parts.map((seg: string) => {
          const trimmed = seg.trim()
          return isDottedI18nKey(trimmed) ? translate(trimmed) : seg
        })
        out.push(rebuilt.join('|'))
      } else {
        out.push(processedLine)
      }
      continue
    }

    const hm = processedLine.match(HEADING_KEY)
    if (hm) {
      const key = hm[2]
      const rendered = translate(key)
      out.push(`${hm[1]} ${rendered}`)
      continue
    }

    const bqm = processedLine.match(BLOCKQUOTE_KEY_ONLY)
    if (bqm) {
      const key = bqm[2]
      out.push(`${bqm[1]}${translate(key)}`)
      continue
    }

    const olm = processedLine.match(OL_ITEM_KEY)
    if (olm) {
      const key = olm[2]
      out.push(`${olm[1]}${translate(key)}`)
      continue
    }

    const ulm = processedLine.match(UL_ITEM_KEY)
    if (ulm) {
      const key = ulm[2]
      out.push(`${ulm[1]}${translate(key)}`)
      continue
    }

    if (processedLine.includes('|')) {
      const parts = processedLine.split('|')
      const anyKey = parts.some((seg: string) => isDottedI18nKey(seg.trim()))
      if (anyKey) {
        const rebuilt = parts.map((seg: string) => {
          const trimmed = seg.trim()
          return isDottedI18nKey(trimmed) ? translate(trimmed) : seg
        })
        out.push(rebuilt.join('|'))
        continue
      }
    }

    const lm = processedLine.match(LINE_KEY_ONLY)
    if (lm) {
      const key = lm[1]
      out.push(translate(key))
      continue
    }

    out.push(processedLine)
  }

  let result = out.join('\n')
  for (let i = annoSlices.length - 1; i >= 0; i--) {
    result = result.split(annoPlaceholder(i)).join(annoSlices[i]!)
  }
  return normalizeTrailingDoublePipe(normalizePipeBeforeAnno(result))
}
