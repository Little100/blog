import { MARKDOWN_INLINE_ANNOTATION_PATTERN } from './annotationMarkdown'

const DOTTED_KEY = /^[a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+$/i

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

const IMG_ALT_KEY = /!\[([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)\]\(([^)\s]+)\)/gi

const LINE_KEY_ONLY = /^[\t ]*([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)[\t ]*$/i

const HEADING_KEY = /^(#{1,6})[\t ]+([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)[\t ]*$/i

const BLOCKQUOTE_KEY_ONLY = /^([\t ]*>\s*)([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)[\t ]*$/i

const OL_ITEM_KEY = /^([\t ]*\d+\.\s+)([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)[\t ]*$/i

const UL_ITEM_KEY = /^([\t ]*[-*]\s+)([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)[\t ]*$/i

export function expandMarkdownI18nKeys(
  source: string,
  translate: (key: string) => string,
): string {
  const annoSlices: string[] = []
  const annoRe = new RegExp(
    MARKDOWN_INLINE_ANNOTATION_PATTERN.source,
    MARKDOWN_INLINE_ANNOTATION_PATTERN.flags,
  )
  const withoutAnno = source.replace(annoRe, (full) => {
    const i = annoSlices.length
    annoSlices.push(full)
    return annoPlaceholder(i)
  })

  const withAlt = withoutAnno.replace(IMG_ALT_KEY, (full, key: string, url: string) => {
    if (!isDottedI18nKey(key)) return full
    const alt = translate(key.trim())
    return `![${alt}](${url})`
  })

  const lines = withAlt.split(/\r?\n/)
  let inFence = false
  const out: string[] = []

  for (const line of lines) {
    const trimmedStart = line.trimStart()
    if (trimmedStart.startsWith('```')) {
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }

    const processedLine = line.replace(
      /\btitle:([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)(?=\s|>)/gi,
      (_m: string, key: string) => `title:${translate(key)}`,
    )

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
      out.push(processedLine)
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
  return result
}
