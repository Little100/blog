import { createBundledHighlighter, createSingletonShorthands } from '@shikijs/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

const fenceLangLoaders = {
  bash: () => import('@shikijs/langs/bash'),
  cpp: () => import('@shikijs/langs/cpp'),
  csharp: () => import('@shikijs/langs/csharp'),
  css: () => import('@shikijs/langs/css'),
  diff: () => import('@shikijs/langs/diff'),
  go: () => import('@shikijs/langs/go'),
  html: () => import('@shikijs/langs/html'),
  java: () => import('@shikijs/langs/java'),
  javascript: () => import('@shikijs/langs/javascript'),
  js: () => import('@shikijs/langs/javascript'),
  json: () => import('@shikijs/langs/json'),
  jsonc: () => import('@shikijs/langs/jsonc'),
  markdown: () => import('@shikijs/langs/markdown'),
  md: () => import('@shikijs/langs/md'),
  python: () => import('@shikijs/langs/python'),
  py: () => import('@shikijs/langs/python'),
  rust: () => import('@shikijs/langs/rust'),
  shellscript: () => import('@shikijs/langs/shellscript'),
  sh: () => import('@shikijs/langs/shellscript'),
  shell: () => import('@shikijs/langs/shellscript'),
  sql: () => import('@shikijs/langs/sql'),
  ts: () => import('@shikijs/langs/typescript'),
  tsx: () => import('@shikijs/langs/tsx'),
  typescript: () => import('@shikijs/langs/typescript'),
  vue: () => import('@shikijs/langs/vue'),
  xml: () => import('@shikijs/langs/xml'),
  yaml: () => import('@shikijs/langs/yaml'),
  yml: () => import('@shikijs/langs/yaml'),
} as const

/** Language ids available for fenced blocks (subset of Shiki grammars, code-split). */
export const blogShikiLangIds = new Set<string>(Object.keys(fenceLangLoaders))

/**
 * Fine-grained Shiki bundle: languages and themes load on first use (code-split chunks).
 */
const createHighlighter = createBundledHighlighter({
  themes: {
    'github-dark': () => import('@shikijs/themes/github-dark'),
    'github-light': () => import('@shikijs/themes/github-light'),
  },
  langs: fenceLangLoaders,
  engine: () => createOnigurumaEngine(import('shiki/wasm')),
})

export const { codeToHtml } = createSingletonShorthands(createHighlighter)

export type BlogShikiTheme = 'github-dark' | 'github-light'
