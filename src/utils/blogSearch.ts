import { parseFrontmatter } from './frontmatter'
import { expandMarkdownI18nKeys } from './i18nKeys'
import { stripMarkdownAnnotations } from './annotationMarkdown'
import type { BlogIndexItem } from '../data/posts'
import type { Locale } from '../i18n/translations'

const haystackCache = new Map<string, string>()

function cacheKey(locale: Locale, slug: string) {
  return `${locale}::${slug}`
}

export async function loadPostSearchHaystack(
  slug: string,
  locale: Locale,
  translate: (key: string) => string,
): Promise<string> {
  const key = cacheKey(locale, slug)
  const hit = haystackCache.get(key)
  if (hit !== undefined) return hit

  const res = await fetch(`/content/posts/${encodeURIComponent(slug)}.md`)
  if (!res.ok) {
    haystackCache.set(key, '')
    return ''
  }
  const raw = await res.text()
  const { body } = parseFrontmatter(raw)
  const expanded = expandMarkdownI18nKeys(body, translate)
  const plain = stripMarkdownAnnotations(expanded)
  const lower = plain.toLowerCase()
  haystackCache.set(key, lower)
  return lower
}

export async function filterBlogIndexByQuery(
  posts: readonly BlogIndexItem[],
  query: string,
  locale: Locale,
  t: (key: string) => string,
): Promise<BlogIndexItem[]> {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...posts]

  const withHaystack = await Promise.all(
    posts.map(async (p) => {
      const title = t(p.titleKey).toLowerCase()
      const excerpt = t(p.excerptKey).toLowerCase()
      const tagHit = p.tagKeys.some((k) => t(k).toLowerCase().includes(needle))
      if (title.includes(needle) || excerpt.includes(needle) || tagHit) {
        return { post: p, match: true as const }
      }
      const body = await loadPostSearchHaystack(p.slug, locale, t)
      return { post: p, match: body.includes(needle) as boolean }
    }),
  )

  return withHaystack.filter((x) => x.match).map((x) => x.post)
}
