import { publicAssetUrl } from './publicAssetUrl'
import { parseFrontmatter } from './frontmatter'
import { stripMarkdownAnnotations } from './annotationMarkdown'
import type { Locale } from '../i18n/translations'

const haystackCache = new Map<string, string>()

function cacheKey(locale: Locale, slug: string) {
  return `${locale}::${slug}`
}

export async function loadPostSearchHaystack(
  slug: string,
  locale: Locale,
): Promise<string> {
  const key = cacheKey(locale, slug)
  const hit = haystackCache.get(key)
  if (hit !== undefined) return hit

  const res = await fetch(
    publicAssetUrl(`/content/${locale}/posts/${encodeURIComponent(slug)}.md`),
  )
  if (!res.ok) {
    haystackCache.set(key, '')
    return ''
  }

  const raw = await res.text()
  const { body } = parseFrontmatter(raw)
  const plain = stripMarkdownAnnotations(body)
  const lower = plain.toLowerCase()
  haystackCache.set(key, lower)
  return lower
}
