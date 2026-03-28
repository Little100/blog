import { annotationTone, sanitizeAnnoIdPrefix } from './annotationVariation'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type MarkdownAnnotation = {
  body: string
  title: string
}

export const MARKDOWN_INLINE_ANNOTATION_PATTERN =
  /\|\{\[\([\s\S]*?\)\]\}\|([^|]*)\|/g

const ANNO_PATTERN = MARKDOWN_INLINE_ANNOTATION_PATTERN

function stripAnnotationsInText(text: string): string {
  return text.replace(ANNO_PATTERN, (_match, inner: string) => String(inner).trim())
}

function replaceAnnotationsInText(
  text: string,
  annotations: MarkdownAnnotation[],
  idPrefix: string,
  nextIndex: { n: number },
  translate?: (key: string) => string,
): string {
  return text.replace(ANNO_PATTERN, (_match, inner: string, titleRaw: string) => {
    const rawBody = String(inner).trim()
    const rawTitle = String(titleRaw ?? '').trim()
    const body = translate ? (translate(rawBody) || rawBody) : rawBody
    const title = translate ? (translate(rawTitle) || rawTitle) : rawTitle
    const i = nextIndex.n++
    annotations.push({ body, title })
    const badge = i + 1
    const tone = annotationTone(idPrefix, i)
    return `<span class="md-anno" data-anno-index="${i}" data-anno-tone="${tone}" id="BLOG-anno-text-${idPrefix}-${i}"><span class="md-anno__badge" aria-hidden="true">${badge}</span>${escapeHtml(body)}</span>`
  })
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

  while (pos < source.length) {
    const fenceStart = source.indexOf('```', pos)
    if (fenceStart === -1) {
      out.push(replaceAnnotationsInText(source.slice(pos), annotations, idPrefix, nextIndex, translate))
      break
    }
    if (fenceStart > pos) {
      out.push(
        replaceAnnotationsInText(source.slice(pos, fenceStart), annotations, idPrefix, nextIndex, translate),
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

  return { body: out.join(''), annotations }
}

export function stripMarkdownAnnotations(source: string): string {
  const out: string[] = []
  let pos = 0

  while (pos < source.length) {
    const fenceStart = source.indexOf('```', pos)
    if (fenceStart === -1) {
      out.push(stripAnnotationsInText(source.slice(pos)))
      break
    }
    if (fenceStart > pos) {
      out.push(stripAnnotationsInText(source.slice(pos, fenceStart)))
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
