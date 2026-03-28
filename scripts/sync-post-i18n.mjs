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
const DEFAULT_LOCALE = 'zh'

const DOTTED_KEY = /^[a-z][a-z0-9]*(?:\.[a-z0-9][\w.-]*)+$/i

const SKIP_FM_KEYS = new Set(['date', 'author', 'icon', 'readMinutes'])

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath))
  const sorted = Object.keys(data).sort().reduce((a, k) => { a[k] = data[k]; return a }, {})
  fs.writeFileSync(filePath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
}

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

function slugify(text) {
  const hasLatin = /[a-zA-Z0-9]/.test(text)
  if (!hasLatin) {
    return text.slice(0, 20)
  }
  return text
    .toLowerCase()
    .replace(/[\s\p{P}]+/gu, '.')
    .replace(/^-+|-+$/g, '')
    .replace(/\.{2,}/g, '.')
    .slice(0, 40)
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

function extractKeysAndText(source, body, docPrefix) {
  const fmTextToKey = {}
  const bodyKeyToText = {}
  const ANNO_RE = /\|\{\[\(([\s\S]*?)\)\]\}\|([^|]*)\|/g

  for (const [k, v] of Object.entries(source.fm)) {
    if (SKIP_FM_KEYS.has(k)) continue

    const s = String(v).trim()
    if (DOTTED_KEY.test(s)) {
      fmTextToKey[s] = s
      continue
    }

    if (k === 'tags') {
      const tags = parseTagKeysFromFm(v)
      for (const tag of tags) {
        if (!DOTTED_KEY.test(tag)) {
          const generatedKey = `${docPrefix}.tag.${slugify(tag)}`
          fmTextToKey[tag] = generatedKey
        }
      }
      continue
    }

    if (s) {
      fmTextToKey[s] = `${docPrefix}.${k}`
    }
  }

  const lines = body.split(/\r?\n/)
  let inFence = false
  let paragraphCounter = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()

    if (t.startsWith('```')) { inFence = !inFence; continue }
    if (inFence) continue

    const imgAltMatches = [...line.matchAll(/!\[([^\]]+)\]\([^)]+\)/g)]
    for (const m of imgAltMatches) {
      const alt = m[1].trim()
      if (alt && !DOTTED_KEY.test(alt)) {
        bodyKeyToText[alt] = `${docPrefix}.img.${slugify(alt)}`
      }
    }

    if (t.startsWith('![') && !t.includes('|')) continue
    if (/^\[[^\]]+\]\([^)]+\)\s*$/.test(t)) continue

    if (/^\|.*\|\s*$/.test(t) && t.includes('|') && !t.includes('|{[(')) {
      for (const cell of t.split('|')) {
        const trimmed = cell.trim()
        if (trimmed && !DOTTED_KEY.test(trimmed) && !trimmed.startsWith('-') && !/^\d+$/.test(trimmed)) {
          if (!bodyKeyToText[trimmed]) {
            bodyKeyToText[trimmed] = `${docPrefix}.table.cell${paragraphCounter++}`
          }
        }
      }
      continue
    }

    const hm = t.match(/^#{1,6}\s+(.+?)\s*$/)
    if (hm) {
      const content = hm[1].trim()
      if (!DOTTED_KEY.test(content)) {
        bodyKeyToText[content] = `${docPrefix}.section.${slugify(content)}`
      }
      continue
    }

    const bqm = t.match(/^>\s+(.+?)\s*$/)
    if (bqm) {
      const content = bqm[1].trim()
      if (!DOTTED_KEY.test(content)) {
        bodyKeyToText[content] = `${docPrefix}.pullquote`
      }
      continue
    }

    if (t.startsWith('<') && !t.includes('|{[(')) continue
    if (!t) continue

    const annoMatches = [...t.matchAll(ANNO_RE)]
    if (annoMatches.length > 0) {
      for (const m of annoMatches) {
        const inner = String(m[1]).trim()
        const title = String(m[2] ?? '').trim()
        if (inner && !DOTTED_KEY.test(inner)) {
          bodyKeyToText[inner] = `${docPrefix}.annotation.body`
        }
        if (title && !DOTTED_KEY.test(title)) {
          bodyKeyToText[title] = `${docPrefix}.annotation.title`
        }
      }
      continue
    }

    if (t.includes('|')) {
      const parts = t.split('|')
      for (const part of parts) {
        const trimmed = part.trim()
        if (trimmed && !DOTTED_KEY.test(trimmed) && !trimmed.startsWith('![') && !/^-+$/.test(trimmed)) {
          if (!bodyKeyToText[trimmed]) {
            bodyKeyToText[trimmed] = `${docPrefix}.block.${paragraphCounter++}`
          }
        }
      }
      continue
    }

    if (!DOTTED_KEY.test(t)) {
      bodyKeyToText[t] = `${docPrefix}.p${paragraphCounter++}`
    }
  }

  return { fmTextToKey, bodyKeyToText }
}

function replaceTextWithKeys(body, keyToTextMap) {
  const sortedEntries = Object.entries(keyToTextMap).sort((a, b) => b[0].length - a[0].length)

  let result = body
  for (const [text, key] of sortedEntries) {
    result = result.split(text).join(key)
  }

  return result
}

function replaceImageAltsWithKeys(body, keyToTextMap) {
  const result = body.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, (match, alt, url) => {
    const trimmedAlt = alt.trim()
    if (keyToTextMap[trimmedAlt]) {
      return `![${keyToTextMap[trimmedAlt]}](${url})`
    }
    return match
  })
  return result
}

function replaceTagsWithKeys(fm, keyToTextMap) {
  if (!fm.tags) return fm
  
  const tags = parseTagKeysFromFm(fm.tags)
  const newTags = tags.map(tag => keyToTextMap[tag] || tag)
  
  return {
    ...fm,
    tags: JSON.stringify(newTags)
  }
}

function mergeI18nData(existingData, newTranslations) {
  const merged = { ...existingData }
  for (const [text, key] of Object.entries(newTranslations)) {
    if (merged[key]) {
      continue
    }
    if (merged[text]) {
      continue
    }
    merged[key] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? text : '']))
  }
  return merged
}

function buildPostMeta({ full, rel, keyToTextMap }) {
  const raw = fs.readFileSync(full, 'utf8')
  const { fm } = parseFrontmatterBlock(raw)
  const slug = rel.replace(/\.md$/i, '').replace(/^posts\//, '')

  const tagKeys = []
  const tags = parseTagKeysFromFm(fm.tags)
  for (const tag of tags) {
    if (DOTTED_KEY.test(tag)) {
      tagKeys.push(tag)
    } else if (keyToTextMap[tag]) {
      tagKeys.push(keyToTextMap[tag])
    }
  }

  let titleKey = fm.title || ''
  if (titleKey && !DOTTED_KEY.test(titleKey) && keyToTextMap[titleKey]) {
    titleKey = keyToTextMap[titleKey]
  }

  let excerptKey = fm.excerpt || fm.title || ''
  if (excerptKey && !DOTTED_KEY.test(excerptKey) && keyToTextMap[excerptKey]) {
    excerptKey = keyToTextMap[excerptKey]
  }

  const descRaw = String(fm.description ?? '').trim()
  let descriptionKey = ''
  if (DOTTED_KEY.test(descRaw)) {
    descriptionKey = descRaw
  } else if (keyToTextMap[descRaw]) {
    descriptionKey = keyToTextMap[descRaw]
  }

  return {
    slug,
    sourceRel: rel,
    titleKey,
    date: fm.date || '',
    tagKeys,
    excerptKey,
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

function scanContent() {
  const homePath = path.join(SRC_DIR, 'home.md')
  const postsDir = path.join(SRC_DIR, 'posts')
  const home = fs.existsSync(homePath) ? { full: homePath, rel: 'home.md' } : null
  const posts = walkMd(postsDir, 'posts')
  return { home, posts }
}

function main() {
  const { home, posts } = scanContent()
  const allFiles = [...(home ? [home] : []), ...posts]

  if (allFiles.length === 0) {
    console.warn('[sync-post-i18n] No markdown files under public/content/source')
    return
  }

  let i18nFiles = 0
  let parsedFiles = 0
  const postEntries = []

  for (const f of allFiles) {
    const raw = fs.readFileSync(f.full, 'utf8')
    const { fm, body } = parseFrontmatterBlock(raw)

    const docPrefix = f.rel === 'home.md'
      ? 'content.home'
      : `post.${path.basename(f.rel, '.md')}`

    const { fmTextToKey, bodyKeyToText } = extractKeysAndText({ fm, body }, body, docPrefix)
    const allKeyToText = { ...fmTextToKey, ...bodyKeyToText }

    let bodyWithKeys = replaceTextWithKeys(body, bodyKeyToText)
    bodyWithKeys = replaceImageAltsWithKeys(bodyWithKeys, bodyKeyToText)

    const { i18nPublic, i18nVite, parsedMd } = resolvePaths(f.rel)

    let existingI18n = {}
    if (fs.existsSync(i18nPublic)) {
      try { existingI18n = JSON.parse(fs.readFileSync(i18nPublic, 'utf8')) } catch {}
    }

    const mergedI18n = mergeI18nData(existingI18n, allKeyToText)

    if (Object.keys(mergedI18n).length > 0) {
      writeJson(i18nPublic, mergedI18n)
      ensureDir(path.dirname(i18nVite))
      fs.copyFileSync(i18nPublic, i18nVite)
      i18nFiles++
    }

    let newFm = { ...fm }
    for (const [text, key] of Object.entries(fmTextToKey)) {
      for (const [fmKey, fmValue] of Object.entries(newFm)) {
        if (fmValue === text || fmValue === key) {
          newFm[fmKey] = key
        }
      }
    }
    newFm = replaceTagsWithKeys(newFm, fmTextToKey)

    const fmLines = Object.entries(newFm).map(([k, v]) => `  ${k}: ${yamlString(v)}`).join('\n')
    const md = fmLines ? `---\n${fmLines}\n---\n${bodyWithKeys}\n` : bodyWithKeys

    ensureDir(path.dirname(parsedMd))
    fs.writeFileSync(parsedMd, md, 'utf8')
    parsedFiles++

    if (f.rel !== 'home.md') {
      postEntries.push({ full: f.full, rel: f.rel, keyToTextMap: allKeyToText })
    }
  }

  const entries = postEntries
    .map((f) => buildPostMeta(f))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))

  patchPostsTs(entries)

  const postRels = new Set(posts.map(p => p.rel))

  console.log(`[sync-post-i18n] ${allFiles.length} source file(s)`)
  console.log(`  → ${i18nFiles} i18n JSON(s) synced (public/content/i18n/ + src/i18n/content/)`)
  console.log(`  → ${parsedFiles} parsed Markdown(s) with keys written to public/content/`)
  console.log(`  → posts.ts BLOG_INDEX patched (${entries.length} entry(s))`)

  cleanStale(postRels, I18N_OUT, 'json', 'posts/')
  cleanStale(postRels, VITE_I18N_OUT, 'json', 'posts/')
  cleanStale(postRels, path.join(PARSED_OUT, 'posts'), 'md', '')
}

main()
