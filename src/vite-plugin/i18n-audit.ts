import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

const INTERVAL_MS = 30_000

function getPostCountByLocale(contentDir: string, locales: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const locale of locales) {
    const dir = path.join(contentDir, locale, 'posts')
    try {
      counts.set(
        locale,
        fs.existsSync(dir)
          ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).length
          : 0,
      )
    } catch {
      counts.set(locale, 0)
    }
  }
  return counts
}

function warnLocaleMismatch(
  server: ViteDevServer,
  counts: Map<string, number>,
  defaultLang: string,
): void {
  const others = [...counts.entries()].filter(([l]) => l !== defaultLang)
  const defaultCount = counts.get(defaultLang) ?? 0

  for (const [locale, count] of others) {
    if (count !== defaultCount) {
      server.config.logger.warn(
        `[i18n-audit] ⚠  Locale "${locale}" has ${count} post file(s), ` +
          `but default locale "${defaultLang}" has ${defaultCount}. ` +
          `Add missing translations to public/content/${locale}/posts/ to silence this warning.`,
      )
    }
  }
}

function loadLocalesFromConfig(configPath: string): {
  languages: string[]
  defaultLanguage: string
} {
  try {
    const raw = fs.readFileSync(configPath, 'utf8')
    const cfg = JSON.parse(raw) as {
      languages?: string[]
      defaultLanguage?: string
    }
    const langs = Array.isArray(cfg.languages) ? cfg.languages : ['en']
    const def = cfg.defaultLanguage || langs[0] || 'en'
    return { languages: langs, defaultLanguage: def }
  } catch {
    return { languages: ['en'], defaultLanguage: 'en' }
  }
}

export function i18nAuditPlugin(): Plugin {
  const configPath = path.join(process.cwd(), 'config.json')
  const contentDir = path.join(process.cwd(), 'public', 'content')

  let server: ViteDevServer | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null

  function checkAndWarn() {
    if (!server) return
    const { languages, defaultLanguage } = loadLocalesFromConfig(configPath)
    const counts = getPostCountByLocale(contentDir, languages)
    warnLocaleMismatch(server, counts, defaultLanguage)
  }

  return {
    name: 'i18n-audit',

    configureServer(s: ViteDevServer) {
      server = s

      // Watch all locale post directories
      const { languages } = loadLocalesFromConfig(configPath)
      for (const locale of languages) {
        const dir = path.join(contentDir, locale, 'posts')
        if (fs.existsSync(dir)) {
          s.watcher.add(dir)
        }
      }
      // Also watch config.json changes
      s.watcher.add(configPath)

      // Initial check after server starts (slightly delayed to let the console settle)
      setTimeout(checkAndWarn, 500)

      // Periodic check every 30 seconds
      intervalId = setInterval(checkAndWarn, INTERVAL_MS)
    },

    closeBundle() {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    },
  }
}
