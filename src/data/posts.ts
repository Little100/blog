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
    "slug": "annotation-demo",
    "sourceRel": "posts/annotation-demo.md",
    "titleKey": "批注功能演示",
    "date": "2026-03-28",
    "tagKeys": [
      "功能",
      "笔记"
    ],
    "excerptKey": "批注功能演示",
    "descriptionKey": "",
    "icon": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80"
  },
  {
    "slug": "assets-workflow",
    "sourceRel": "posts/assets-workflow.md",
    "titleKey": "图片工作流：全自动压缩与 GitHub 体积管理",
    "date": "2026-03-27",
    "tagKeys": [
      "工具",
      "工作流"
    ],
    "excerptKey": "图片工作流：全自动压缩与 GitHub 体积管理",
    "descriptionKey": "",
    "icon": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80"
  },
  {
    "slug": "kyoto",
    "sourceRel": "posts/kyoto.md",
    "titleKey": "摄影师手记：伏见稻荷的静默与鸟居",
    "date": "2023-10-26",
    "tagKeys": [
      "旅行",
      "摄影"
    ],
    "excerptKey": "摄影师手记：伏见稻荷的静默与鸟居",
    "descriptionKey": "",
    "icon": "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=1200&q=80"
  },
  {
    "slug": "literature",
    "sourceRel": "posts/literature.md",
    "titleKey": "文学与逻辑：慢读与结构",
    "date": "2023-09-12",
    "tagKeys": [
      "阅读",
      "写作"
    ],
    "excerptKey": "文学与逻辑：慢读与结构",
    "descriptionKey": "",
    "icon": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80"
  },
  {
    "slug": "simplicity",
    "sourceRel": "posts/simplicity.md",
    "titleKey": "简约之美",
    "date": "2023-08-01",
    "tagKeys": [
      "生活",
      "设计"
    ],
    "excerptKey": "简约之美",
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
