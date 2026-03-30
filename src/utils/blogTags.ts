import type { PostMeta } from '../i18n/postIndex'

export type TagAggregate = {
  slug: string
  label: string
  count: number
}

/**
 * URL-safe tag key for query params. Uses Unicode letters/numbers so CJK tags
 * (e.g. 旅行) are not stripped — `\w` in JS is ASCII-only and would drop them.
 */
export function slugifyTag(tag: string): string {
  const t = tag.trim().toLowerCase()
  if (!t) return ''
  const collapsed = t.replace(/\s+/g, '-')
  const cleaned = collapsed.replace(/[^\p{L}\p{N}_-]/gu, '')
  return cleaned.replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export function postMatchesTagSlug(post: PostMeta, tagSlug: string): boolean {
  if (!tagSlug) return true
  return post.tags.some((t) => slugifyTag(t) === tagSlug)
}

export function aggregateTagsFromPosts(posts: readonly PostMeta[]): TagAggregate[] {
  const bySlug = new Map<string, { count: number; label: string }>()
  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = slugifyTag(tag)
      if (!slug) continue
      const prev = bySlug.get(slug)
      if (prev) {
        prev.count += 1
      } else {
        bySlug.set(slug, { count: 1, label: tag })
      }
    }
  }
  return [...bySlug.entries()]
    .map(([slug, { count, label }]) => ({ slug, label, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
}
