import { blogShikiLangIds } from '../shiki/blogHighlighter'

const ALIAS: Record<string, string> = {
  'c++': 'cpp',
  'c#': 'csharp',
  zsh: 'bash',
}

/** Human-readable labels for the language badge (English, common in dev tooling). */
const DISPLAY: Record<string, string> = {
  bash: 'Bash',
  cpp: 'C++',
  csharp: 'C#',
  css: 'CSS',
  diff: 'Diff',
  go: 'Go',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  jsonc: 'JSON',
  markdown: 'Markdown',
  md: 'Markdown',
  python: 'Python',
  py: 'Python',
  rust: 'Rust',
  shellscript: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  sql: 'SQL',
  ts: 'TypeScript',
  tsx: 'TSX',
  typescript: 'TypeScript',
  vue: 'Vue',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
}

function prettifyLabel(raw: string): string {
  const s = raw.trim()
  if (s.length <= 5) return s.toUpperCase()
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function resolveFenceLang(rawTag: string): { shiki: string; label: string } {
  const normalized = rawTag.toLowerCase()
  const key = ALIAS[normalized] ?? normalized
  const shiki = blogShikiLangIds.has(key) ? key : 'text'
  const label = DISPLAY[normalized] ?? DISPLAY[key] ?? prettifyLabel(rawTag)
  return { shiki, label }
}
