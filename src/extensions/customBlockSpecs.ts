import type { CalloutTitleSpec, DocumentSegment, ZigzagItem } from '../markdown/segmentTypes'

export type CustomBlockKind = 'callout' | 'zigzag'

export type CustomBlockSpec = {
  kind: CustomBlockKind
  pattern: RegExp
}

export const CUSTOM_BLOCK_SPECS: CustomBlockSpec[] = [
  {
    kind: 'zigzag',
    pattern: /(?<=(?:^|\n))[^\S\r\n]*<zigzag>[\s\S]*?^<\/zigzag>/gm,
  },
  {
    kind: 'callout',
    pattern: /(?<=(?:^|\n))[^\S\r\n]*<(?!zigzag>)(?!span(?:[\s/>]|$))\w[\w-]*[^\n>]*>[\s\S]*?^<\/\w[\w-]*>/gm,
  },
]

function parseCalloutOpenTag(openTag: string): {
  icon: string
  collapsible: boolean
  defaultOpen: boolean
  title: CalloutTitleSpec
} {
  const trimmed = openTag.trim()
  const m = trimmed.match(/^<(\w[\w-]*)\s*(.*?)\s*>$/s)
  if (!m) {
    return {
      icon: 'circle-question',
      collapsible: false,
      defaultOpen: true,
      title: { mode: 'default' },
    }
  }

  const icon = m[1]
  let inner = (m[2] ?? '').trim()

  let title: CalloutTitleSpec = { mode: 'default' }
  const titleIdx = inner.indexOf('title:')
  if (titleIdx >= 0) {
    title = { mode: 'explicit', text: inner.slice(titleIdx + 'title:'.length).trim() }
    inner = inner.slice(0, titleIdx).trim()
  }

  let collapsible = false
  let defaultOpen = true
  const collapsibleRe = /\bcollapsible(?::(open|close))?\b/g
  let cm: RegExpExecArray | null
  while ((cm = collapsibleRe.exec(inner)) !== null) {
    collapsible = true
    if (cm[1] === 'close') defaultOpen = false
    else defaultOpen = true
  }

  return { icon, collapsible, defaultOpen, title }
}

function extractBody(fullMatch: string, tagName: string): string {
  const openTagEnd = fullMatch.indexOf('>')
  const closeTagStart = fullMatch.lastIndexOf(`</${tagName}>`)
  if (openTagEnd === -1 || closeTagStart === -1) {
    return fullMatch.slice(openTagEnd + 1).trimEnd()
  }
  return fullMatch.slice(openTagEnd + 1, closeTagStart).trimEnd()
}

export function splitByCustomBlocks(raw: string): DocumentSegment[] {
  type MatchInfo = {
    index: number
    end: number
    kind: CustomBlockKind
    body: string
    icon: string
    collapsible: boolean
    defaultOpen: boolean
    collapsibleTitle: CalloutTitleSpec
    zigzagItems?: ZigzagItem[]
  }

  const segments: DocumentSegment[] = []
  let cursor = 0
  const len = raw.length

  while (cursor < len) {
    let next: MatchInfo | null = null

    for (const spec of CUSTOM_BLOCK_SPECS) {
      spec.pattern.lastIndex = cursor
      const m = spec.pattern.exec(raw)
      if (!m || m.index < cursor) continue
      if (!next || m.index < next.index) {
        const fullMatch = m[0]
        const openLine = fullMatch.split('\n')[0]
        const gt = openLine.indexOf('>')
        const openTag = gt === -1 ? openLine : openLine.slice(0, gt + 1)

        if (spec.kind === 'zigzag') {
          const body = extractBody(fullMatch, 'zigzag')
          next = {
            index: m.index,
            end: spec.pattern.lastIndex,
            kind: 'zigzag',
            body,
            icon: '',
            collapsible: false,
            defaultOpen: true,
            collapsibleTitle: { mode: 'default' },
            zigzagItems: parseZigzagBody(body),
          }
        } else {
          const { icon, collapsible, defaultOpen, title: collapsibleTitle } = parseCalloutOpenTag(openTag)
          const body = extractBody(fullMatch, icon)
          next = {
            index: m.index,
            end: spec.pattern.lastIndex,
            kind: spec.kind,
            body,
            icon,
            collapsible,
            defaultOpen,
            collapsibleTitle,
          }
        }
      }
    }

    if (!next) {
      const tail = raw.slice(cursor)
      if (tail) segments.push({ kind: 'markdown', body: tail })
      break
    }

    if (next.index > cursor) {
      segments.push({ kind: 'markdown', body: raw.slice(cursor, next.index) })
    }

    if (next.kind === 'zigzag' && next.zigzagItems) {
      segments.push({ kind: 'zigzag', items: next.zigzagItems })
    } else {
      segments.push({
        kind: 'callout',
        body: next.body,
        icon: next.icon,
        collapsible: next.collapsible,
        defaultOpen: next.defaultOpen,
        collapsibleTitle: next.collapsibleTitle,
      })
    }
    cursor = next.end
  }

  if (segments.length === 0) {
    segments.push({ kind: 'markdown', body: raw })
  }

  return segments
}

function parseZigzagBody(body: string): ZigzagItem[] {
  const items: ZigzagItem[] = []
  for (const line of body.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const imgLeft = trimmed.match(/^!\[.*?\]\([^)]+\)\|(.+)$/s)
    if (imgLeft) {
      items.push({
        direction: 'img-left',
        image: imgLeft[0].replace(/\|.+$/, ''),
        text: imgLeft[1].trim(),
      })
      continue
    }

    const imgRight = trimmed.match(/^(.+)\|!\[.*?\]\([^)]+\)$/s)
    if (imgRight) {
      items.push({
        direction: 'img-right',
        image: imgRight[0].replace(/^.+\|/, ''),
        text: imgRight[1].trim(),
      })
      continue
    }

    const last = items[items.length - 1]
    if (last) {
      last.text = last.text ? `${last.text}\n\n${trimmed}` : trimmed
    }
  }
  return items
}
