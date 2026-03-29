import type { LucideIcon, LucideProps } from 'lucide-react'
import {
  Braces,
  CodeXml,
  Coffee,
  Database,
  FileCode,
  FileText,
  GitBranch,
  ListTree,
  Palette,
  Terminal,
} from 'lucide-react'

const BY_LANG: Record<string, LucideIcon> = {
  json: Braces,
  jsonc: Braces,
  typescript: FileCode,
  ts: FileCode,
  tsx: FileCode,
  javascript: FileCode,
  js: FileCode,
  python: FileCode,
  py: FileCode,
  bash: Terminal,
  sh: Terminal,
  shell: Terminal,
  shellscript: Terminal,
  markdown: FileText,
  md: FileText,
  rust: FileCode,
  go: FileCode,
  java: Coffee,
  cpp: FileCode,
  csharp: FileCode,
  css: Palette,
  html: CodeXml,
  xml: CodeXml,
  yaml: ListTree,
  yml: ListTree,
  vue: FileCode,
  sql: Database,
  diff: GitBranch,
  text: FileText,
  plaintext: FileText,
  txt: FileText,
}

export function FenceLangIcon({
  lang,
  ...rest
}: { lang: string } & Omit<LucideProps, 'ref'>) {
  const Icon = BY_LANG[lang] ?? FileCode
  return <Icon aria-hidden size={14} strokeWidth={2} {...rest} />
}
