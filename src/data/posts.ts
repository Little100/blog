export type PostMeta = {
  slug: string
  date: string
  tags: string[]
  icon: string
}

export type BlogIndexItem = PostMeta

export const BLOG_INDEX: PostMeta[] = [
  {
    slug: 'shiki-demo',
    date: '2026-03-29',
    tags: ['demo', 'shiki', 'code'],
    icon: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
  },
  {
    slug: 'annotation-demo',
    date: '2026-03-28',
    tags: ['功能', '笔记'],
    icon: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80',
  },
  {
    slug: 'assets-workflow',
    date: '2026-03-27',
    tags: ['工具', '工作流'],
    icon: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80',
  },
  {
    slug: 'kyoto',
    date: '2023-10-26',
    tags: ['旅行', '摄影'],
    icon: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=1200&q=80',
  },
  {
    slug: 'literature',
    date: '2023-09-12',
    tags: ['阅读', '写作'],
    icon: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80',
  },
  {
    slug: 'simplicity',
    date: '2023-08-01',
    tags: ['生活', '设计'],
    icon: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80',
  },
]

export function getPostMeta(slug: string): PostMeta | undefined {
  return BLOG_INDEX.find((p) => p.slug === slug)
}
