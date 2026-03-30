import { siteConfig } from '../config/site'

export type PostMeta = {
  title: string
  titleEn?: string
  date: string
  lastEdited?: string
  author: string
  readMinutes: number
  tags: string[]
  icon?: string
  description?: string
  hero?: string
  related?: string
  excerpt?: string
}

const DEFAULT_META: PostMeta = {
  title: '',
  date: '',
  author: siteConfig.defaultAuthor,
  readMinutes: 5,
  tags: [],
}

/** Strip YAML double/single quotes from scalar values (e.g. icon: "https://..."). */
function unquoteYamlScalar(value: string): string {
  const s = value.trim()
  if (s.length < 2) return s
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1)
  }
  return s
}

function optionalUnquoted(raw: string | undefined): string | undefined {
  if (raw === undefined || !String(raw).trim()) return undefined
  return unquoteYamlScalar(String(raw))
}

function parseTagsValue(raw: string | undefined): string[] {
  if (raw === undefined || !String(raw).trim()) return []
  const t = String(raw).trim()
  if (t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t) as unknown
      if (Array.isArray(parsed)) return parsed.map((x) => String(x))
    } catch {
      // YAML-style [foo, bar, baz] without JSON quotes
      if (t.endsWith(']')) {
        const inner = t.slice(1, -1).trim()
        if (inner.length === 0) return []
        return inner
          .split(/\s*,\s*/)
          .map((s) => unquoteYamlScalar(s))
          .filter(Boolean)
      }
    }
  }
  return t
    .split(/\s*[·,，]\s*/)
    .map((s) => unquoteYamlScalar(s))
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

  const readMinutes = Number.parseInt(unquoteYamlScalar(raw.readMinutes ?? '5'), 10)
  const meta: PostMeta = {
    ...DEFAULT_META,
    title: raw.title !== undefined ? unquoteYamlScalar(raw.title) : DEFAULT_META.title,
    titleEn: optionalUnquoted(raw.titleEn),
    date: raw.date !== undefined ? unquoteYamlScalar(raw.date) : DEFAULT_META.date,
    lastEdited: optionalUnquoted(raw.lastEdited),
    author: raw.author !== undefined ? unquoteYamlScalar(raw.author) : DEFAULT_META.author,
    readMinutes: Number.isFinite(readMinutes) ? readMinutes : 5,
    tags: parseTagsValue(raw.tags),
    icon: optionalUnquoted(raw.icon),
    description: optionalUnquoted(raw.description),
    hero: optionalUnquoted(raw.hero),
    related: optionalUnquoted(raw.related),
    excerpt: optionalUnquoted(raw.excerpt),
  }

  return { meta, body }
}
