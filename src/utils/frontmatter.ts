import { siteConfig } from '../config/site'

export type PostMeta = {
  title: string
  titleEn?: string
  date: string
  author: string
  readMinutes: number
  tags: string[]
  description?: string
  hero?: string
  related?: string
}

const DEFAULT_META: PostMeta = {
  title: '',
  date: '',
  author: siteConfig.defaultAuthor,
  readMinutes: 5,
  tags: [],
}

function parseTagsValue(raw: string | undefined): string[] {
  if (raw === undefined || !String(raw).trim()) return []
  const t = String(raw).trim()
  if (t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t) as unknown
      if (Array.isArray(parsed)) return parsed.map((x) => String(x))
    } catch {
    }
  }
  return t
    .split(/\s*[·,，]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseLine(line: string): [string, string] | null {
  const idx = line.indexOf(':')
  if (idx < 0) return null
  const key = line.slice(0, idx).trim()
  const value = line.slice(idx + 1).trim()
  return [key, value]
}

export function parseFrontmatter(source: string): {
  meta: PostMeta
  body: string
} {
  const m = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) {
    return { meta: { ...DEFAULT_META }, body: source }
  }
  const block = m[1].trim()
  const body = m[2]
  const raw: Record<string, string> = {}
  for (const line of block.split(/\r?\n/)) {
    const p = parseLine(line)
    if (p) raw[p[0]] = p[1]
  }

  const readMinutes = Number.parseInt(raw.readMinutes ?? '5', 10)
  const meta: PostMeta = {
    ...DEFAULT_META,
    title: raw.title ?? DEFAULT_META.title,
    titleEn: raw.titleEn,
    date: raw.date ?? DEFAULT_META.date,
    author: raw.author ?? DEFAULT_META.author,
    readMinutes: Number.isFinite(readMinutes) ? readMinutes : 5,
    tags: parseTagsValue(raw.tags),
    description: raw.description,
    hero: raw.hero,
    related: raw.related,
  }

  return { meta, body }
}
