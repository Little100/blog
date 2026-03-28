import type { BlogIndexItem } from '../data/posts'

export type TagAggregate = {
  slug: string
  labelKey: string
  count: number
}

export function tagKeyToSlug(tagKey: string): string {
  const s = tagKey.trim()
  if (!s) return s
  const parts = s.split('.')
  return parts[parts.length - 1] ?? s
}

export function postMatchesTagSlug(post: BlogIndexItem, tagSlug: string): boolean {
  if (!tagSlug) return true
  return post.tagKeys.some((k) => tagKeyToSlug(k) === tagSlug)
}

export function aggregateTagsFromPosts(posts: readonly BlogIndexItem[]): TagAggregate[] {
  const bySlug = new Map<string, { count: number; labelKey: string }>()
  for (const post of posts) {
    for (const key of post.tagKeys) {
      const slug = tagKeyToSlug(key)
      if (!slug) continue
      const prev = bySlug.get(slug)
      if (prev) {
        prev.count += 1
      } else {
        bySlug.set(slug, { count: 1, labelKey: key })
      }
    }
  }
  return [...bySlug.entries()]
    .map(([slug, { count, labelKey }]) => ({ slug, labelKey, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
}
