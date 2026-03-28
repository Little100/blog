import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const SRC_DIR = path.join(ROOT, 'public', 'content', 'source')
const I18N_OUT = path.join(ROOT, 'public', 'content', 'i18n')
const VITE_I18N_OUT = path.join(ROOT, 'src', 'i18n', 'content')
const PARSED_OUT = path.join(ROOT, 'public', 'content')
const POSTS_TS = path.join(ROOT, 'src', 'data', 'posts.ts')
const LOCALES = ['en', 'ja', 'zh', 'zh-TW']

const DOTTED_KEY = /^[a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+$/i

function parseFrontmatterBlock(source) {
  const m = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) return { fm: {}, body: source }
  const fm = {}
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx < 0) continue
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
  }
  return { fm, body: m[2] }
}

function parseTagKeysFromFm(tagsRaw) {
  if (tagsRaw === undefined || tagsRaw === null) return []
  const s = String(tagsRaw).trim()
  if (!s.startsWith('[')) return []
  try {
    const parsed = JSON.parse(s)
    if (!Array.isArray(parsed)) return []
    return parsed.map((x) => String(x).trim()).filter(Boolean)
  } catch {
    return []
  }
}

function fmKeys(fm) {
  const keys = new Set()
  for (const [k, v] of Object.entries(fm)) {
    if (k === 'tags') {
      for (const tag of parseTagKeysFromFm(v)) {
        if (DOTTED_KEY.test(tag)) keys.add(tag)
      }
      continue
    }
    if (typeof v === 'string' && DOTTED_KEY.test(v)) keys.add(v)
  }
  return keys
}

function bodyKeys(body) {
  const keys = new Set()
  const ANNO_RE = /\|\{\[\(([\s\S]*?)\)\]\}\|([^|]*)\|/g
  const lines = body.split(/\r?\n/)
  let inFence = false
  for (const line of lines) {
    const t = line.trim()
    if (t.startsWith('```')) { inFence = !inFence; continue }
    if (inFence) continue
    if (!t) continue
    if (t.startsWith('![') && !t.includes('|')) continue
    if (/^\[[^\]]+\]\([^)]+\)\s*$/.test(t)) continue
    if (
      /^\|.*\|\s*$/.test(t) &&
      t.includes('|') &&
      !t.includes('|{[(')
    ) {
      continue
    }

    const hm = line.match(/^(#{1,6})\s+([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)\s*$/i)
    if (hm) { keys.add(hm[2]); continue }
    const bqm = line.match(/^>\s+([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)\s*$/i)
    if (bqm) { keys.add(bqm[1]); continue }
    const olm = line.match(/^[\t ]*\d+\.\s+([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)[\t ]*$/i)
    if (olm) { keys.add(olm[1]); continue }
    const ulm = line.match(/^[\t ]*[-*]\s+([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)[\t ]*$/i)
    if (ulm) { keys.add(ulm[1]); continue }
    const lm = line.match(/^[\t ]*([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)[\t ]*$/i)
    if (lm) keys.add(lm[1])
    for (const m of t.matchAll(/!\[([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)\]\([^)]+\)/gi)) { keys.add(m[1]) }
    for (const m of line.matchAll(/\btitle:([a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+)(?=\s|>)/gi)) { keys.add(m[1]) }
    for (const p of t.split('|').map(s => s.trim()).filter(Boolean)) { if (DOTTED_KEY.test(p)) keys.add(p) }
    for (const m of line.matchAll(ANNO_RE)) {
      const inner = String(m[1]).trim()
      const title = String(m[2] ?? '').trim()
      if (DOTTED_KEY.test(inner)) keys.add(inner)
      if (DOTTED_KEY.test(title)) keys.add(title)
    }
  }
  return keys
}

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath))
  const sorted = Object.keys(data).sort().reduce((a, k) => { a[k] = data[k]; return a }, {})
  fs.writeFileSync(filePath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
}

function syncI18nKeys(jsonPath, keys) {
  let data = {}
  if (fs.existsSync(jsonPath)) {
    try { data = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) } catch {}
  }
  let changed = false
  for (const key of keys) {
    if (!data[key]) {
      data[key] = Object.fromEntries(LOCALES.map(l => [l, '']))
      changed = true
    } else {
      for (const loc of LOCALES) {
        if (data[key][loc] === undefined) { data[key][loc] = ''; changed = true }
      }
    }
  }
  if (changed) writeJson(jsonPath, data)
}

function scanContent() {
  const homePath = path.join(SRC_DIR, 'home.md')
  const postsDir = path.join(SRC_DIR, 'posts')
  const home = fs.existsSync(homePath) ? { full: homePath, rel: 'home.md' } : null
  const posts = walkMd(postsDir, 'posts')
  return { home, posts }
}

function walkMd(dir, baseRel) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const rel = path.join(baseRel, name).replace(/\\/g, '/')
    const st = fs.statSync(full)
    if (st.isDirectory()) out.push(...walkMd(full, rel))
    else if (name.endsWith('.md')) out.push({ full, rel })
  }
  return out
}

function resolvePaths(rel) {
  const i18nRel = rel.replace(/\.md$/i, '.json')
  return {
    i18nPublic: path.join(I18N_OUT, i18nRel),
    i18nVite: path.join(VITE_I18N_OUT, i18nRel),
    parsedMd: path.join(PARSED_OUT, rel),
  }
}

function yamlString(v) { return typeof v === 'string' && v.includes(':') ? `"${v}"` : v }

function rm(filePath) {
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch {}
}

function rmdir(dir) {
  try {
    if (!fs.existsSync(dir)) return
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
  } catch {}
}

function cleanStale(currentRels, outDir, ext, relPrefix = '') {
  const relMap = new Map()
  for (const rel of currentRels) {
    const key = rel.replace(/^posts\//, relPrefix).replace(/\.md$/, `.${ext}`)
    relMap.set(key, true)
  }
  relMap.set(`home.${ext}`, true)

  if (!fs.existsSync(outDir)) return

  function walk(dir, prefix) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      const rel = (prefix ? prefix + '/' : '') + name
      const st = fs.statSync(full)
      if (st.isDirectory()) {
        walk(full, rel)
        rmdir(full)
      } else {
        const normalized = rel.replace(/\\/g, '/')
        if (!relMap.has(normalized)) {
          rm(full)
          console.log(`  [clean] removed stale ${normalized}`)
        }
      }
    }
  }
  walk(outDir, '')
}

function buildPostMeta({ full, rel }) {
  const raw = fs.readFileSync(full, 'utf8')
  const { fm } = parseFrontmatterBlock(raw)
  const slug = rel.replace(/\.md$/i, '').replace(/^posts\//, '')
  const tagKeys = parseTagKeysFromFm(fm.tags)
  const descRaw = String(fm.description ?? '').trim()
  const descriptionKey = DOTTED_KEY.test(descRaw) ? descRaw : ''
  return {
    slug,
    sourceRel: rel,
    titleKey: fm.title || '',
    date: fm.date || '',
    tagKeys,
    excerptKey: fm.excerpt || fm.title || '',
    descriptionKey,
    icon: String(fm.icon ?? '').trim(),
  }
}

function patchPostsTs(entries) {
  const raw = fs.readFileSync(POSTS_TS, 'utf8')

  const blogIdx = raw.indexOf('export const BLOG_INDEX')
  const autoIdx = raw.indexOf('// ── AUTO-GENERATED SECTION')

  if (blogIdx === -1 || autoIdx === -1) {
    console.warn('[sync-post-i18n] posts.ts BLOG_INDEX/AUTO markers not found — skipping patch')
    return
  }

  const prefix = raw.slice(0, blogIdx)
  const suffix = raw.slice(autoIdx)
  const blogIndexLines = `export const BLOG_INDEX: PostMeta[] = ${JSON.stringify(entries, null, 2)}`
  fs.writeFileSync(POSTS_TS, `${prefix}${blogIndexLines}\n${suffix}`, 'utf8')
}

function main() {
  const { home, posts } = scanContent()
  const allFiles = [...(home ? [home] : []), ...posts]

  if (allFiles.length === 0) {
    console.warn('[sync-post-i18n] No markdown files under public/content/source')
    return
  }

  const entries = posts
    .map((f) => buildPostMeta(f))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  patchPostsTs(entries)

  let i18nFiles = 0
  let parsedFiles = 0

  const postRels = new Set(posts.map(p => p.rel))

  for (const f of allFiles) {
    const raw = fs.readFileSync(f.full, 'utf8')
    const { fm, body } = parseFrontmatterBlock(raw)
    const allKeys = new Set([...fmKeys(fm), ...bodyKeys(body)])
    const { i18nPublic, i18nVite, parsedMd } = resolvePaths(f.rel)

    if (allKeys.size === 0) {
      ensureDir(path.dirname(parsedMd))
      fs.writeFileSync(parsedMd, raw, 'utf8')
      parsedFiles++
      continue
    }

    syncI18nKeys(i18nPublic, allKeys)
    ensureDir(path.dirname(i18nVite))
    fs.copyFileSync(i18nPublic, i18nVite)
    i18nFiles++

    const fmLines = Object.entries(fm).map(([k, v]) => `  ${k}: ${yamlString(v)}`).join('\n')
    const md = fmLines ? `---\n${fmLines}\n---\n${body}` : body
    ensureDir(path.dirname(parsedMd))
    fs.writeFileSync(parsedMd, md, 'utf8')
    parsedFiles++
  }

  console.log(`[sync-post-i18n] ${allFiles.length} source file(s)`)
  console.log(`  → ${i18nFiles} i18n JSON(s) synced (public/content/i18n/ + src/i18n/content/)`)
  console.log(`  → ${parsedFiles} parsed Markdown(s) written to public/content/`)
  console.log(`  → posts.ts BLOG_INDEX patched (${entries.length} entry(s))`)

  cleanStale(postRels, I18N_OUT, 'json', 'posts/')
  cleanStale(postRels, VITE_I18N_OUT, 'json', 'posts/')
  cleanStale(postRels, path.join(PARSED_OUT, 'posts'), 'md', '')
}

main()
