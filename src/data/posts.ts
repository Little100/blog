import type { Locale } from '../i18n/translations'

export type PostMeta = {
  slug: string
  sourceRel: string
  titleKey: string
  date: string
  tagKeys: string[]
  excerptKey: string
  descriptionKey: string
  icon: string
}

export type BlogIndexItem = PostMeta

export const BLOG_INDEX: PostMeta[] = [
  {
    "slug": "shiki-demo",
    "sourceRel": "posts/shiki-demo.md",
    "titleKey": "post.shiki-demo.title",
    "date": "2026-03-29",
    "tagKeys": [],
    "excerptKey": "post.shiki-demo.excerpt",
    "descriptionKey": "post.shiki-demo.description",
    "icon": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80"
  },
  {
    "slug": "annotation-demo",
    "sourceRel": "posts/annotation-demo.md",
    "titleKey": "post.annotation-demo.title",
    "date": "2026-03-28",
    "tagKeys": [
      "post.annotation-demo.tag.功能",
      "post.annotation-demo.tag.笔记"
    ],
    "excerptKey": "post.annotation-demo.title",
    "descriptionKey": "post.annotation-demo.description",
    "icon": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80"
  },
  {
    "slug": "assets-workflow",
    "sourceRel": "posts/assets-workflow.md",
    "titleKey": "post.assets-workflow.title",
    "date": "2026-03-27",
    "tagKeys": [
      "post.assets-workflow.tag.工具",
      "post.assets-workflow.tag.工作流"
    ],
    "excerptKey": "post.assets-workflow.title",
    "descriptionKey": "post.assets-workflow.description",
    "icon": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80"
  },
  {
    "slug": "kyoto",
    "sourceRel": "posts/kyoto.md",
    "titleKey": "post.kyoto.title",
    "date": "2023-10-26",
    "tagKeys": [
      "post.kyoto.tag.旅行",
      "post.kyoto.tag.摄影"
    ],
    "excerptKey": "post.kyoto.title",
    "descriptionKey": "",
    "icon": "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=1200&q=80"
  },
  {
    "slug": "literature",
    "sourceRel": "posts/literature.md",
    "titleKey": "post.literature.title",
    "date": "2023-09-12",
    "tagKeys": [
      "post.literature.tag.阅读",
      "post.literature.tag.写作"
    ],
    "excerptKey": "post.literature.title",
    "descriptionKey": "",
    "icon": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80"
  },
  {
    "slug": "simplicity",
    "sourceRel": "posts/simplicity.md",
    "titleKey": "post.simplicity.title",
    "date": "2023-08-01",
    "tagKeys": [
      "post.simplicity.tag.生活",
      "post.simplicity.tag.设计"
    ],
    "excerptKey": "post.simplicity.title",
    "descriptionKey": "",
    "icon": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80"
  }
]
// ── AUTO-GENERATED SECTION
// This marker is used by scripts/sync-post-i18n.mjs and scripts/generate-sitemap.mjs
// Do not remove or move this line — keep it at the end of the file

export function getPostMeta(slug: string): PostMeta | undefined {
  return BLOG_INDEX.find((p) => p.slug === slug)
}

export function resolvePostTitle(
  meta: PostMeta,
  _locale: Locale,
  t: (key: string) => string,
): string {
  const raw = meta.titleKey.trim()
  if (!raw || !raw.includes('.')) return raw || meta.slug
  const resolved = t(raw)
  return resolved !== raw ? resolved : raw
}
