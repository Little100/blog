import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const CONFIG_PATH = path.join(ROOT, 'config.json')
const SRC_DIR = path.join(ROOT, 'public', 'content', 'source')
const I18N_OUT = path.join(ROOT, 'public', 'content', 'i18n')
const VITE_I18N_OUT = path.join(ROOT, 'src', 'i18n', 'content')
const PARSED_OUT = path.join(ROOT, 'public', 'content')
const POSTS_TS = path.join(ROOT, 'src', 'data', 'posts.ts')

function loadConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    return {
      locales: Array.isArray(config.languages) ? config.languages : ['en', 'ja', 'zh', 'zh-TW'],
      defaultLocale: config.defaultLanguage || config.seo?.defaultLocale || 'zh'
    }
  } catch {
    return {
      locales: ['en', 'ja', 'zh', 'zh-TW'],
      defaultLocale: 'zh'
    }
  }
}

const { locales: LOCALES, defaultLocale: DEFAULT_LOCALE } = loadConfig()

const I18N_KEY_SEGMENT = '(?:[a-z0-9][\\w-]*|[\\p{L}\\p{M}\\p{N}_\\-:：.（）]+)'
const DOTTED_KEY_BODY = `(?:post|content)\\.${I18N_KEY_SEGMENT}(?:\\.${I18N_KEY_SEGMENT})*\\.?`
const DOTTED_KEY = new RegExp(`^${DOTTED_KEY_BODY}$`, 'iu')

const SKIP_FM_KEYS = new Set(['date', 'author', 'icon', 'readMinutes'])

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

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

/** Keep in sync with `findAnnotationRowClosingPipe` / `scanAnnotationRow` in src/utils/annotationMarkdown.ts */
function findAnnotationRowClosingPipe(source, tailStart) {
  const lineEnd = source.indexOf('\n', tailStart)
  const limit = lineEnd === -1 ? source.length : lineEnd
  const firstLine = source.slice(tailStart, limit)
  const rel0 = firstLine.lastIndexOf('|')
  if (rel0 !== -1 && /^\s*$/.test(firstLine.slice(rel0 + 1))) {
    return tailStart + rel0
  }

  if (lineEnd === -1) {
    const idx = source.indexOf('|', tailStart)
    return idx === -1 ? -1 : idx
  }

  const after = source.slice(lineEnd + 1)
  const m = after.match(/^(\s*)\|\s*(?:\r?\n|$)/)
  if (m) return lineEnd + 1 + m[1].length

  let searchFrom = lineEnd + 1
  while (searchFrom < source.length) {
    const nl = source.indexOf('\n', searchFrom)
    const lineEndIdx = nl === -1 ? source.length : nl
    const line = source.slice(searchFrom, lineEndIdx)
    const rel = line.lastIndexOf('|')
    if (rel !== -1 && /^\s*$/.test(line.slice(rel + 1))) {
      return searchFrom + rel
    }
    if (nl === -1) break
    searchFrom = nl + 1
  }
  return -1
}

function parseAnnotationAt(source, at) {
  const START = '|{[('
  if (!source.startsWith(START, at)) return null
  let i = at + START.length
  if (i >= source.length) return null
  let depth = 1
  const innerStart = i
  while (i < source.length && depth > 0) {
    const c = source[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    i++
  }
  if (depth !== 0) return null
  const inner = source.slice(innerStart, i - 1)
  if (source[i] !== ']' || source[i + 1] !== '}') return null
  i += 2

  if (source[i] !== '|') {
    const tailStart = i
    const pipeAt = findAnnotationRowClosingPipe(source, tailStart)
    if (pipeAt === -1) return null
    let tail = source.slice(tailStart, pipeAt)
    const idSuffix = tail.match(/^(.*):(\d+)$/)
    if (idSuffix) tail = idSuffix[1].trimEnd()
    return { inner, tail, tailStart, pipeAt, fullEnd: pipeAt + 1 }
  }

  const closingPipeAt = i
  const afterBrace = i + 1
  const lineEnd = source.indexOf('\n', afterBrace)
  const eol = lineEnd === -1 ? source.length : lineEnd
  const onlyWsToEol = /^\s*$/.test(source.slice(afterBrace, eol))

  if (onlyWsToEol) {
    return { inner, tail: '', tailStart: closingPipeAt, pipeAt: closingPipeAt, fullEnd: afterBrace }
  }

  i = afterBrace
  const tailStart = i
  const pipeAt = findAnnotationRowClosingPipe(source, tailStart)
  if (pipeAt === -1) return null
  let tail = source.slice(tailStart, pipeAt)
  const idSuffix = tail.match(/^(.*):(\d+)$/)
  if (idSuffix) tail = idSuffix[1].trimEnd()
  return { inner, tail, tailStart, pipeAt, fullEnd: pipeAt + 1 }
}

function extractAnnotationsFromLine(t) {
  const matches = []
  let pos = 0
  while (pos < t.length) {
    const idx = t.indexOf('|{[(' , pos)
    if (idx === -1) break
    const p = parseAnnotationAt(t, idx)
    if (!p) {
      pos = idx + 1
      continue
    }
    matches.push(p)
    pos = p.fullEnd
  }
  return matches
}

/** Merge following lines until `parseAnnotationAt` succeeds (tail may contain newlines before closing `|`). */
function mergeAnnotationRowLines(lines, startIdx) {
  let buf = lines[startIdx]
  let j = startIdx
  while (true) {
    const at = buf.indexOf('|{[(')
    if (at === -1) return { merged: buf, lastIdx: j }
    if (parseAnnotationAt(buf, at)) return { merged: buf, lastIdx: j }
    j++
    if (j >= lines.length) return { merged: buf, lastIdx: j }
    buf += '\n' + lines[j]
  }
}

function extractKeysAndText(source, body, docPrefix) {
  const keyToLocales = {}

  for (const [k, v] of Object.entries(source.fm)) {
    if (SKIP_FM_KEYS.has(k)) continue

    const s = String(v).trim()
    if (DOTTED_KEY.test(s)) {
      keyToLocales[s] = Object.fromEntries(LOCALES.map(l => [l, s]))
      continue
    }

    if (k === 'tags') {
      const tags = parseTagKeysFromFm(v)
      for (const tag of tags) {
        if (!DOTTED_KEY.test(tag)) {
          const generatedKey = `${docPrefix}.tag.${slugify(tag)}`
          keyToLocales[generatedKey] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? tag : '']))
        }
      }
      continue
    }

    if (s) {
      const fmKey = `${docPrefix}.${k}`
      keyToLocales[fmKey] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? s : '']))
    }
  }

  const lines = body.split(/\r?\n/)
  let inFence = false
  let fenceSeq = 0
  let paragraphCounter = 0
  let annotationSeq = 0
  let tableRowCounter = 0

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (!inFence && line.includes('|{[(')) {
      const { merged, lastIdx } = mergeAnnotationRowLines(lines, i)
      line = merged
      if (lastIdx > i) {
        i = lastIdx
      }
    }
    const t = line.trim()

    if (t.startsWith('```')) {
      if (!inFence) {
        inFence = true
      } else {
        inFence = false
        fenceSeq++
      }
      continue
    }

    if (inFence) {
      const fenceKey = `${docPrefix}.fence.${fenceSeq}`
      if (!keyToLocales[fenceKey]) {
        keyToLocales[fenceKey] = Object.fromEntries(LOCALES.map(l => [l, '']))
      }
      const rawFenceLine = line.replace(/\r$/, '')
      if (keyToLocales[fenceKey][DEFAULT_LOCALE]) {
        keyToLocales[fenceKey][DEFAULT_LOCALE] += '\n' + rawFenceLine
      } else {
        keyToLocales[fenceKey][DEFAULT_LOCALE] = rawFenceLine
      }
      continue
    }

    const imgAltMatches = [...line.matchAll(/!\[([^\]]+)\]\([^)]+\)/g)]
    for (const m of imgAltMatches) {
      const alt = m[1].trim()
      if (alt && !DOTTED_KEY.test(alt)) {
        const altKey = `${docPrefix}.img.${slugify(alt)}`
        keyToLocales[altKey] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? alt : '']))
      }
    }

    if (t.startsWith('![') && !t.includes('|')) continue
    if (/^\[[^\]]+\]\([^)]+\)\s*$/.test(t)) continue

    if (t.includes('|') && !t.includes('|{[(')) continue

    if (t.includes('|{[(')) {
      const annoMatches = extractAnnotationsFromLine(t)
      if (annoMatches.length > 0) {
        for (const m of annoMatches) {
          const n = annotationSeq++
          const inner = String(m.inner).trim()
          const title = String(m.tail ?? '').trim()
          const bodyK = n === 0 ? `${docPrefix}.annotation.body` : `${docPrefix}.annotation.body${n}`
          const titleK = n === 0 ? `${docPrefix}.annotation.title` : `${docPrefix}.annotation.title${n}`
          if (inner && !DOTTED_KEY.test(inner)) {
            keyToLocales[bodyK] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? inner : '']))
          }
          if (title && !DOTTED_KEY.test(title)) {
            keyToLocales[titleK] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? title : '']))
          }
        }
        const before = t.split('|{[(')[0]
        if (before) {
          const beforeTrimmed = before.replace(/^\||\|$/g, '').trim()
          if (beforeTrimmed && !DOTTED_KEY.test(beforeTrimmed)) {
            keyToLocales[`${docPrefix}.p${paragraphCounter++}`] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? beforeTrimmed : '']))
          }
        }
      }
      continue
    }

    const hm = t.match(/^#{1,6}\s+(.+?)\s*$/)
    if (hm) {
      const content = hm[1].trim()
      if (!DOTTED_KEY.test(content)) {
        const sectionKey = `${docPrefix}.section.${slugify(content)}`
        keyToLocales[sectionKey] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? content : '']))
      }
      continue
    }

    const bqm = t.match(/^>\s+(.+?)\s*$/)
    if (bqm) {
      const content = bqm[1].trim()
      if (!DOTTED_KEY.test(content)) {
        const quoteKey = `${docPrefix}.pullquote`
        keyToLocales[quoteKey] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? content : '']))
      }
      continue
    }

    if (t.startsWith('<') && !t.includes('|{[(')) continue
    if (!t) continue

    if (t.includes('|')) {
      const parts = t.split('|')
      for (const part of parts) {
        const trimmed = part.trim()
        if (trimmed && !DOTTED_KEY.test(trimmed) && !trimmed.startsWith('![') && !/^-+$/.test(trimmed)) {
          if (!Object.values(keyToLocales).some(v => v[DEFAULT_LOCALE] === trimmed)) {
            keyToLocales[`${docPrefix}.block.${paragraphCounter++}`] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? trimmed : '']))
          }
        }
      }
      continue
    }

    if (!DOTTED_KEY.test(t)) {
      keyToLocales[`${docPrefix}.p${paragraphCounter++}`] = Object.fromEntries(LOCALES.map(l => [l, l === DEFAULT_LOCALE ? t : '']))
    }
  }

  return keyToLocales
}

function shouldSkipGlobalTextReplace(key) {
  if (key.includes('.tag.')) return true
  if (key.includes('.section.')) return true
  if (/\.annotation\.title\d*$/.test(key)) return true
  if (key.includes('.fence.')) return true
  return false
}

/** Replace ``` fenced blocks whose inner text exactly matches a fence.* i18n blob (avoids substring collisions). */
function replaceFenceBlocksWithKeys(body, keyToTextMap, docPrefix, DEFAULT_LOCALE) {
  const fenceEntries = Object.entries(keyToTextMap)
    .filter(([k]) => k.startsWith(`${docPrefix}.fence.`))
    .sort(
      (a, b) =>
        String(b[1][DEFAULT_LOCALE] ?? '').length - String(a[1][DEFAULT_LOCALE] ?? '').length,
    )

  const lines = body.split(/\r?\n/)
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmedStart = line.trimStart()
    if (!trimmedStart.startsWith('```')) {
      out.push(line)
      i++
      continue
    }
    out.push(line)
    i++
    const inner = []
    while (i < lines.length) {
      const L = lines[i]
      if (L.trimStart().startsWith('```')) break
      inner.push(L)
      i++
    }
    const innerText = inner.join('\n')
    let replaced = false
    for (const [key, loc] of fenceEntries) {
      const text = String(loc[DEFAULT_LOCALE] ?? '')
      if (text && text !== key && innerText === text) {
        const indent = inner[0]?.match(/^(\s*)/)?.[1] ?? ''
        out.push(indent + key)
        replaced = true
        break
      }
    }
    if (!replaced) out.push(...inner)
    if (i < lines.length) {
      out.push(lines[i])
      i++
    }
  }
  return out.join('\n')
}

function replaceTextWithKeys(body, keyToTextMap, docPrefix, DEFAULT_LOCALE) {
  const sortedEntries = Object.entries(keyToTextMap)
    .filter(([key]) => !shouldSkipGlobalTextReplace(key))
    .sort(
      (a, b) =>
        String(b[1][DEFAULT_LOCALE] ?? '').length - String(a[1][DEFAULT_LOCALE] ?? '').length,
    )

  let result = body
  for (const [key, locales] of sortedEntries) {
    const text = locales[DEFAULT_LOCALE]
    if (text && text !== key) {
      result = result.split(text).join(key)
    }
  }

  return result
}

function replaceHeadingsWithKeys(body, keyToTextMap, docPrefix, DEFAULT_LOCALE) {
  const sectionEntries = Object.entries(keyToTextMap)
    .filter(([k]) => k.startsWith(`${docPrefix}.section.`))
    .sort(
      (a, b) =>
        String(b[1][DEFAULT_LOCALE] ?? '').length - String(a[1][DEFAULT_LOCALE] ?? '').length,
    )

  return body
    .split(/\r?\n/)
    .map((line) => {
      const m = line.match(/^(#{1,6})\s+(.+?)\s*$/)
      if (!m) return line
      const content = m[2].trim()
      if (DOTTED_KEY.test(content)) return line
      for (const [key, loc] of sectionEntries) {
        const text = loc[DEFAULT_LOCALE]
        if (text && content === text) {
          return `${m[1]} ${key}`
        }
      }
      return line
    })
    .join('\n')
}

function replaceAnnotationTailsWithKeys(body, keyToTextMap, docPrefix, DEFAULT_LOCALE) {
  const titleEntries = Object.entries(keyToTextMap)
    .filter(([k]) => k.startsWith(`${docPrefix}.annotation.title`))
    .sort(
      (a, b) =>
        String(b[1][DEFAULT_LOCALE] ?? '').length - String(a[1][DEFAULT_LOCALE] ?? '').length,
    )

  function mapTail(tail) {
    for (const [key, loc] of titleEntries) {
      const text = loc[DEFAULT_LOCALE]
      if (!text || text === key) continue
      if (tail === text) return key
      const prefix = `${text}: `
      if (tail.startsWith(prefix)) {
        return `${key}: ${tail.slice(prefix.length)}`
      }
    }
    return tail
  }

  let pos = 0
  let out = ''
  while (pos < body.length) {
    const idx = body.indexOf('|{[(', pos)
    if (idx === -1) {
      out += body.slice(pos)
      break
    }
    out += body.slice(pos, idx)
    const p = parseAnnotationAt(body, idx)
    if (!p) {
      out += body[idx]
      pos = idx + 1
      continue
    }
    const newTail = mapTail(p.tail)
    out += body.slice(idx, p.tailStart) + newTail + body.slice(p.pipeAt, p.fullEnd)
    pos = p.fullEnd
  }
  return out
}

function replaceImageAltsWithKeys(body, keyToTextMap, docPrefix, DEFAULT_LOCALE) {
  const result = body.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, (match, alt, url) => {
    const trimmedAlt = alt.trim()
    for (const [key, locales] of Object.entries(keyToTextMap)) {
      if (locales[DEFAULT_LOCALE] === trimmedAlt) {
        return `![${key}](${url})`
      }
    }
    return match
  })
  return result
}

function replaceTagsWithKeys(fm, keyToTextMap, DEFAULT_LOCALE) {
  if (!fm.tags) return fm
  
  const tags = parseTagKeysFromFm(fm.tags)
  const newTags = tags.map(tag => {
    for (const [key, locales] of Object.entries(keyToTextMap)) {
      if (locales[DEFAULT_LOCALE] === tag) {
        return key
      }
    }
    return tag
  })
  
  return {
    ...fm,
    tags: JSON.stringify(newTags)
  }
}

function isLegacyFormat(key, entry) {
  if (typeof entry !== 'object' || entry === null) return true
  if (key.startsWith('post.') || key.startsWith('content.')) return false
  const keys = Object.keys(entry)
  const localeKeys = keys.filter(k => LOCALES.includes(k))
  if (localeKeys.length === 0) return true
  return localeKeys.some(loc => typeof entry[loc] === 'string' && (entry[loc].startsWith('post.') || entry[loc].startsWith('content.')))
}

function parseJsonWithComments(content) {
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*\]/g, ']')

  try {
    return JSON.parse(stripped)
  } catch {
    return {}
  }
}

function hasExistingTranslation(entry, loc) {
  return entry && entry[loc] && entry[loc].trim() !== ''
}

function mergeI18nData(existingData, newKeyToLocales) {
  const merged = {}
  const sourceChangedKeys = new Set()

  for (const [key, newLocales] of Object.entries(newKeyToLocales)) {
    const existingEntry = existingData[key]

    if (existingEntry && !isLegacyFormat(key, existingEntry)) {
      const localeMap = {}
      const newSourceText = newLocales[DEFAULT_LOCALE]
      const existingSourceText = existingEntry[DEFAULT_LOCALE]
      const sourceChanged = newSourceText !== existingSourceText

      if (sourceChanged) {
        sourceChangedKeys.add(key)
      }

      for (const loc of LOCALES) {
        if (loc === DEFAULT_LOCALE) {
          // 默认语言：始终使用源文本
          localeMap[loc] = newSourceText || ''
        } else if (sourceChanged && existingEntry[loc] && existingEntry[loc].trim()) {
          // 源文本变化且有旧翻译：清空，加 # here
          localeMap[loc] = ''
        } else if (newLocales[loc] && newLocales[loc].trim()) {
          // 非默认语言：使用新翻译
          localeMap[loc] = newLocales[loc]
        } else if (existingEntry[loc] && existingEntry[loc].trim()) {
          // 非默认语言：保留原有翻译
          localeMap[loc] = existingEntry[loc]
        } else {
          localeMap[loc] = ''
        }
      }
      merged[key] = localeMap
    } else {
      merged[key] = { ...newLocales }
    }
  }

  for (const [key, existingEntry] of Object.entries(existingData)) {
    if (isLegacyFormat(key, existingEntry)) continue
    if (!newKeyToLocales[key]) {
      merged[key] = existingEntry
    }
  }

  return { merged, sourceChangedKeys }
}

function writeJson(filePath, data, sourceChangedKeys) {
  ensureDir(path.dirname(filePath))
  const sortedKeys = Object.keys(data).sort()
  const lines = ['{']

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i]
    const entry = data[key]
    const isLast = i === sortedKeys.length - 1
    const hasMarker = sourceChangedKeys.has(key)

    lines.push(`  ${JSON.stringify(key)}: {`)

    for (let j = 0; j < LOCALES.length; j++) {
      const loc = LOCALES[j]
      const val = entry[loc] || ''
      const isLastLoc = j === LOCALES.length - 1
      const comma = isLastLoc ? '' : ','
      const marker = hasMarker && loc !== DEFAULT_LOCALE && val.trim() ? ' # here' : ''
      lines.push(`    ${JSON.stringify(loc)}: ${JSON.stringify(val)}${comma}${marker}`)
    }

    lines.push(`  }${isLast ? '' : ','}`)
  }

  lines.push('}')
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8')
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
    } else {
      for (const [key, locales] of Object.entries(keyToTextMap)) {
        if (locales[DEFAULT_LOCALE] === tag) {
          tagKeys.push(key)
          break
        }
      }
    }
  }

  let titleKey = fm.title || ''
  if (titleKey && !DOTTED_KEY.test(titleKey)) {
    for (const [key, locales] of Object.entries(keyToTextMap)) {
      if (locales[DEFAULT_LOCALE] === titleKey) {
        titleKey = key
        break
      }
    }
  }

  let excerptKey = fm.excerpt || fm.title || ''
  if (excerptKey && !DOTTED_KEY.test(excerptKey)) {
    for (const [key, locales] of Object.entries(keyToTextMap)) {
      if (locales[DEFAULT_LOCALE] === excerptKey) {
        excerptKey = key
        break
      }
    }
  }

  const descRaw = String(fm.description ?? '').trim()
  let descriptionKey = ''
  if (DOTTED_KEY.test(descRaw)) {
    descriptionKey = descRaw
  } else if (descRaw) {
    for (const [key, locales] of Object.entries(keyToTextMap)) {
      if (locales[DEFAULT_LOCALE] === descRaw) {
        descriptionKey = key
        break
      }
    }
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
  const sourceChangedKeysMap = {}

  for (const f of allFiles) {
    const raw = fs.readFileSync(f.full, 'utf8')
    const { fm, body } = parseFrontmatterBlock(raw)

    const docPrefix = f.rel === 'home.md'
      ? 'content.home'
      : `post.${path.basename(f.rel, '.md')}`

    const keyToLocales = extractKeysAndText({ fm, body }, body, docPrefix)

    let bodyWithKeys = replaceTextWithKeys(body, keyToLocales, docPrefix, DEFAULT_LOCALE)
    /* 围栏内保留源码字面量，不写回 post.*.fence.N 键；JSON 里仍收集 fence.* 供翻译工作流 */
    bodyWithKeys = replaceHeadingsWithKeys(bodyWithKeys, keyToLocales, docPrefix, DEFAULT_LOCALE)
    bodyWithKeys = replaceAnnotationTailsWithKeys(bodyWithKeys, keyToLocales, docPrefix, DEFAULT_LOCALE)
    bodyWithKeys = replaceImageAltsWithKeys(bodyWithKeys, keyToLocales, docPrefix, DEFAULT_LOCALE)

    const { i18nPublic, i18nVite, parsedMd } = resolvePaths(f.rel)

    let existingI18n = {}
    if (fs.existsSync(i18nPublic)) {
      existingI18n = parseJsonWithComments(fs.readFileSync(i18nPublic, 'utf8'))
    }

    const result = mergeI18nData(existingI18n, keyToLocales)
    const mergedI18n = result?.merged || {}
    const sourceChangedKeys = result?.sourceChangedKeys || new Set()

    // Track source changed keys per file
    if (sourceChangedKeys.size > 0) {
      sourceChangedKeysMap[f.rel] = sourceChangedKeys
    }

    if (mergedI18n && Object.keys(mergedI18n).length > 0) {
      writeJson(i18nPublic, mergedI18n, sourceChangedKeys)
      ensureDir(path.dirname(i18nVite))
      fs.copyFileSync(i18nPublic, i18nVite)
      i18nFiles++
    }

    let newFm = { ...fm }
    for (const [key, locales] of Object.entries(keyToLocales)) {
      const text = locales[DEFAULT_LOCALE]
      for (const [fmKey, fmValue] of Object.entries(newFm)) {
        if (fmValue === text || fmValue === key) {
          newFm[fmKey] = key
        }
      }
    }
    newFm = replaceTagsWithKeys(newFm, keyToLocales, DEFAULT_LOCALE)

    const fmLines = Object.entries(newFm).map(([k, v]) => `  ${k}: ${yamlString(v)}`).join('\n')
    const md = fmLines ? `---\n${fmLines}\n---\n${bodyWithKeys}\n` : bodyWithKeys

    ensureDir(path.dirname(parsedMd))
    fs.writeFileSync(parsedMd, md, 'utf8')
    parsedFiles++

    if (f.rel !== 'home.md') {
      postEntries.push({ full: f.full, rel: f.rel, keyToTextMap: keyToLocales })
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

  if (postEntries.some(p => sourceChangedKeysMap[p.rel]?.size > 0)) {
    console.log(`\n⚠️  i18n files with pending translations (# here):`)
    for (const [rel, keys] of Object.entries(sourceChangedKeysMap)) {
      if (keys.size > 0) {
        const slug = path.basename(rel, '.md')
        const i18nRel = `posts/${slug}.json`
        console.log(`  - public/content/i18n/${i18nRel}: ${[...keys].join(', ')}`)
        console.log(`    (source: public/content/source/${rel})`)
      }
    }
    console.log(`\nPlease update translations and remove # here markers.`)
  }

  cleanStale(postRels, I18N_OUT, 'json', 'posts/')
  cleanStale(postRels, VITE_I18N_OUT, 'json', 'posts/')
  cleanStale(postRels, path.join(PARSED_OUT, 'posts'), 'md', '')
}

main()
