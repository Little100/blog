export function stripFirstMarkdownH1(source: string): string {
  return source.replace(/^\uFEFF?\s*#\s+[^\r\n]+\r?\n+/, '')
}

export function stripFirstMarkdownImage(source: string): string {
  let s = source.replace(/^\s*!\[[^\]]*\]\([^)]+\)\s*\r?\n*/m, '')
  s = s.replace(
    /^\s*<zigzag>\s*\r?\n[^\r\n]+\|!\[[^\]]*\]\([^)]+\)\s*\r?\n\s*<\/zigzag>\s*\r?\n?/m,
    '',
  )
  return s
}

export function firstMarkdownImageSrc(source: string): string {
  const m = source.match(/!\[[^\]]*\]\(([^)]+)\)/)
  if (!m) return ''
  return m[1].trim().replace(/^<|>$/g, '')
}
