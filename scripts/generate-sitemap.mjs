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

const postsTsPath = path.join(ROOT, 'src', 'data', 'posts.ts')
const postsTsContent = fs.readFileSync(postsTsPath, 'utf8')

const blogIndexStart = postsTsContent.indexOf('export const BLOG_INDEX: PostMeta[] = [')
const autoMarker = '// ── AUTO-GENERATED SECTION'
const autoIdx = postsTsContent.indexOf(autoMarker)

if (blogIndexStart === -1 || autoIdx === -1) {
  console.error('[generate-sitemap] Could not find BLOG_INDEX in posts.ts')
  process.exit(1)
}

const blogIndexRaw = postsTsContent.slice(blogIndexStart + 'export const BLOG_INDEX: PostMeta[] = '.length, autoIdx).trim()
const posts = JSON.parse(blogIndexRaw)

posts.sort((a, b) => String(b.date).localeCompare(String(a.date)))

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0]
  
  const urls = [
    { loc: siteUrl + '/', lastmod: today, priority: '1.0', changefreq: 'weekly' },
    { loc: siteUrl + '/blog', lastmod: today, priority: '0.9', changefreq: 'weekly' },
    { loc: siteUrl + '/about', lastmod: today, priority: '0.7', changefreq: 'monthly' },
    { loc: siteUrl + '/tags', lastmod: today, priority: '0.6', changefreq: 'weekly' },
    { loc: siteUrl + '/contact', lastmod: today, priority: '0.5', changefreq: 'monthly' },
    { loc: siteUrl + '/changelog', lastmod: today, priority: '0.5', changefreq: 'weekly' },
    { loc: siteUrl + '/privacy', lastmod: today, priority: '0.3', changefreq: 'yearly' },
    { loc: siteUrl + '/terms', lastmod: today, priority: '0.3', changefreq: 'yearly' },
  ]
  
  for (const post of posts) {
    urls.push({
      loc: `${siteUrl}/post/${post.slug}`,
      lastmod: post.date || today,
      priority: '0.8',
      changefreq: 'monthly'
    })
  }
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`
  
  const outPath = path.join(ROOT, 'public', 'sitemap.xml')
  fs.writeFileSync(outPath, xml, 'utf8')
  console.log(`[generate-sitemap] Wrote ${outPath} (${urls.length} URLs)`)
}

function generateAtom() {
  const now = new Date().toISOString()
  const updated = now.split('T')[0]
  
  const entries = posts.map((post, i) => {
    const postUrl = `${siteUrl}/post/${post.slug}`
    const title = post.titleKey || post.slug
    const date = post.date ? `${post.date}T00:00:00Z` : `${updated}T00:00:00Z`
    const summary = `Read more about ${title} on ${siteTitle}.`
    
    return `  <entry>
    <title>${escapeXml(title)}</title>
    <link href="${postUrl}" rel="alternate"/>
    <id>${postUrl}</id>
    <updated>${date}</updated>
    <published>${date}</published>
    <summary>${escapeXml(summary)}</summary>
  </entry>`
  }).join('\n')
  
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteTitle)}</title>
  <subtitle>${escapeXml(config.seo?.description?.en || config.seo?.description || 'Personal blog')}</subtitle>
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
