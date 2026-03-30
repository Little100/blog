import { parseFrontmatter } from '../utils/frontmatter'
import type { Locale } from './translations'
import { POST_INDEX_RAW } from 'virtual:post-index'

export type PostMeta = {
  slug: string
  date: string
  lastEdited?: string
  author: string
  readMinutes: number
  tags: string[]
  icon: string
  title: string
  description?: string
  excerpt?: string
}

type LocalePosts = Record<Locale, PostMeta[]>

function buildPostIndex(): LocalePosts {
  const byLocale: LocalePosts = {
    en: [],
    ja: [],
    zh: [],
    'zh-TW': [],
  }

  for (const [key, raw] of Object.entries(POST_INDEX_RAW)) {
    const [locale, ...rest] = key.split('/')
    const slug = rest.join('/')
    const loc = locale as Locale
    if (!(loc in byLocale)) continue
    if (!slug) continue
    const { meta } = parseFrontmatter(raw)
    byLocale[loc].push({
      slug,
      date: meta.date || '',
      lastEdited: meta.lastEdited,
      author: meta.author || '',
      readMinutes: meta.readMinutes || 5,
      tags: meta.tags || [],
      icon: meta.icon || '',
      title: meta.title || slug,
      description: meta.description,
      excerpt: meta.excerpt || meta.description,
    })
  }

  for (const loc of Object.keys(byLocale) as Locale[]) {
    byLocale[loc].sort((a, b) => String(b.date).localeCompare(String(a.date)))
  }

  return byLocale
}

export const POST_INDEX_BY_LOCALE = buildPostIndex()
