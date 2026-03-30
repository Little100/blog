import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const configPath = path.join(ROOT, 'config.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const siteUrl = config.seo?.siteUrl || 'https://your-domain.com'
const siteTitle = config.title || "Little100's Blog"
const repo = config.updates?.repo || 'Little100/blog'

const languages = Array.isArray(config.languages) ? config.languages : ['en']
const defaultLanguage = config.defaultLanguage || languages[0] || 'en'

const CONTENT_DIR = path.join(ROOT, 'public', 'content')

function scanPostsInLocale(locale) {
  const dir = path.join(CONTENT_DIR, locale, 'posts')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '')
      const filePath = path.join(dir, f)
      const raw = fs.readFileSync(filePath, 'utf8')
      const dateMatch = raw.match(/^date:\s*(\S+)/m)
      const titleMatch = raw.match(/^title:\s*(.+)/m)
      return {
        slug,
        date: dateMatch ? dateMatch[1] : '',
        title: titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, '') : slug,
      }
    })
}

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0]

  const urls = []

  // Default language: root URLs (no /{locale} prefix)
  const defaultPages = [
    { loc: `${siteUrl}/`, lastmod: today, priority: '1.0', changefreq: 'weekly' },
    { loc: `${siteUrl}/blog`, lastmod: today, priority: '0.9', changefreq: 'weekly' },
    { loc: `${siteUrl}/about`, lastmod: today, priority: '0.7', changefreq: 'monthly' },
    { loc: `${siteUrl}/tags`, lastmod: today, priority: '0.6', changefreq: 'weekly' },
    { loc: `${siteUrl}/contact`, lastmod: today, priority: '0.5', changefreq: 'monthly' },
    { loc: `${siteUrl}/changelog`, lastmod: today, priority: '0.5', changefreq: 'weekly' },
    { loc: `${siteUrl}/privacy`, lastmod: today, priority: '0.3', changefreq: 'yearly' },
    { loc: `${siteUrl}/terms`, lastmod: today, priority: '0.3', changefreq: 'yearly' },
  ]

  // Default language posts
  const defaultPosts = scanPostsInLocale(defaultLanguage)
  for (const post of defaultPosts) {
    urls.push({
      loc: `${siteUrl}/post/${post.slug}`,
      lastmod: post.date || today,
      priority: '0.8',
      changefreq: 'monthly',
    })
  }

  // Other languages: always carry /{locale} prefix
  for (const lang of languages) {
    if (lang === defaultLanguage) {
      urls.push(...defaultPages)
      continue
    }
    urls.push(
      { loc: `${siteUrl}/${lang}/`, lastmod: today, priority: '1.0', changefreq: 'weekly' },
      { loc: `${siteUrl}/${lang}/blog`, lastmod: today, priority: '0.9', changefreq: 'weekly' },
      { loc: `${siteUrl}/${lang}/about`, lastmod: today, priority: '0.7', changefreq: 'monthly' },
      { loc: `${siteUrl}/${lang}/tags`, lastmod: today, priority: '0.6', changefreq: 'weekly' },
      { loc: `${siteUrl}/${lang}/contact`, lastmod: today, priority: '0.5', changefreq: 'monthly' },
      { loc: `${siteUrl}/${lang}/changelog`, lastmod: today, priority: '0.5', changefreq: 'weekly' },
      { loc: `${siteUrl}/${lang}/privacy`, lastmod: today, priority: '0.3', changefreq: 'yearly' },
      { loc: `${siteUrl}/${lang}/terms`, lastmod: today, priority: '0.3', changefreq: 'yearly' },
    )
    const posts = scanPostsInLocale(lang)
    for (const post of posts) {
      urls.push({
        loc: `${siteUrl}/${lang}/post/${post.slug}`,
        lastmod: post.date || today,
        priority: '0.8',
        changefreq: 'monthly',
      })
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  const outPath = path.join(ROOT, 'public', 'sitemap.xml')
  fs.writeFileSync(outPath, xml, 'utf8')
  console.log(`[generate-sitemap] Wrote ${outPath} (${urls.length} URLs, ${languages.length} locales)`)
}

function generateAtom() {
  const now = new Date().toISOString()
  const updated = now.split('T')[0]

  const posts = scanPostsInLocale(defaultLanguage)
  const entries = posts.map((post) => {
    const postUrl = `${siteUrl}/post/${post.slug}`
    const title = post.title || post.slug
    const date = post.date ? `${post.date}T00:00:00Z` : `${updated}T00:00:00Z`

    return `  <entry>
    <title>${escapeXml(title)}</title>
    <link href="${postUrl}" rel="alternate"/>
    <id>${postUrl}</id>
    <updated>${date}</updated>
    <published>${date}</published>
    <summary>Read more about ${escapeXml(title)} on ${escapeXml(siteTitle)}.</summary>
  </entry>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteTitle)}</title>
  <subtitle>${escapeXml(config.seo?.description || 'Personal blog')}</subtitle>
  <link href="${siteUrl}/atom.xml" rel="self"/>
  <link href="${siteUrl}/"/>
  <id>${siteUrl}/</id>
  <updated>${updated}T00:00:00Z</updated>
  <author>
    <name>${escapeXml(config.defaultAuthor || 'Little100')}</name>
  </author>
  <generator uri="https://vitejs.dev/">Vite</generator>
  <icon>${siteUrl}/avatar.png</icon>
  <logo>${siteUrl}/og-image.png</logo>
${entries}
</feed>`

  const outPath = path.join(ROOT, 'public', 'atom.xml')
  fs.writeFileSync(outPath, xml, 'utf8')
  console.log(`[generate-sitemap] Wrote ${outPath} (${posts.length} posts)`)
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

console.log('[generate-sitemap] Starting sitemap and RSS feed generation...')
generateSitemap()
generateAtom()
console.log('[generate-sitemap] Done!')
