import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type PreviewServer } from 'vite'
import { compressAssetsPlugin } from './src/vite-plugin/compress-assets'
import { i18nAuditPlugin } from './src/vite-plugin/i18n-audit'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

const VIRTUAL_POST_INDEX = 'virtual:post-index'

/**
 * Reads markdown post files directly via Node.js fs and exposes them as a Vite
 * virtual module. This avoids Vite's "assets in public directory cannot be imported
 * from JavaScript" warning that occurs when using import.meta.glob on public/.
 */
function virtualPostIndexPlugin(): Plugin {
  const LOCALE_POSTS_DIR = path.join(projectRoot, 'public', 'content')
  const SUPPORTED_LOCALES = ['en', 'ja', 'zh', 'zh-TW']

  function buildIndex(): string {
    // Rolldown does not transpile TypeScript in virtual modules, so emit plain JS.
    const entries: string[] = []
    for (const locale of SUPPORTED_LOCALES) {
      const localeDir = path.join(LOCALE_POSTS_DIR, locale, 'posts')
      if (!fs.existsSync(localeDir)) continue
      const files = fs.readdirSync(localeDir).filter((f) => f.endsWith('.md'))
      for (const file of files) {
        const slug = file.replace(/\.md$/, '')
        const filePath = path.join(localeDir, file)
        const raw = fs.readFileSync(filePath, 'utf8')
        // Escape for a JS template literal: \ ` $ and \
        const escaped = raw
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$')
        entries.push(
          `"${locale}/${slug}": \`${escaped}\``,
        )
      }
    }
    // Plain JS object — Rolldown won't accept TypeScript here.
    return `export const POST_INDEX_RAW = {\n${entries.join(',\n')}\n};`
  }

  let lastIndex = ''
  function getIndex() {
    const current = buildIndex()
    if (current !== lastIndex) {
      lastIndex = current
    }
    return current
  }

  return {
    name: 'virtual-post-index',
    resolveId(id) {
      if (id === VIRTUAL_POST_INDEX) return VIRTUAL_POST_INDEX
    },
    load(id) {
      if (id === VIRTUAL_POST_INDEX) return getIndex()
    },
    configureServer(server) {
      server.watcher.add(path.join(LOCALE_POSTS_DIR))
      server.watcher.on('change', (file) => {
        if (String(file).includes(path.join('public', 'content'))) {
          lastIndex = '' // force rebuild on next load
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      })
    },
  }
}

const COOKIE_NAME = 'BLOG_accept_language'

function attachAcceptLanguageCookie(req: IncomingMessage, res: ServerResponse) {
  const rawUrl = req.url
  if (!rawUrl) return
  const pathname = rawUrl.split('?')[0]
  if (!pathname) return
  if (pathname !== '/' && pathname !== '/index.html') return
  const raw = req.headers['accept-language']
  if (!raw) return
  const headerValue = typeof raw === 'string' ? raw : raw[0]
  if (!headerValue) return
  const encoded = encodeURIComponent(headerValue)
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encoded}; Path=/; Max-Age=86400; SameSite=Lax`,
  )
}

function acceptLanguageCookiePlugin(): Plugin {
  return {
    name: 'accept-language-cookie',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        attachAcceptLanguageCookie(req, res)
        next()
      })
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use((req, res, next) => {
        attachAcceptLanguageCookie(req, res)
        next()
      })
    },
  }
}

function watchConfigJsonPlugin(): Plugin {
  const configPath = path.join(projectRoot, 'config.json')
  return {
    name: 'watch-config-json',
    configureServer(server) {
      server.watcher.add(configPath)
      server.watcher.on('change', (file) => {
        if (path.normalize(file) === path.normalize(configPath)) {
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      })
    },
  }
}

/**
 * GitHub Pages **project** sites (`/repo/`) do not reliably serve a custom 404 by copying `index.html` alone.
 *
 * We use a custom redirect instead of the rafgraph `?/...` pattern so that:
 * 1. The original full URL (pathname + search + hash) is preserved in the `origin` query param.
 * 2. After `index.html` loads, a router-level `<Navigate>` component reads `?origin=...`
 *    and navigates to the real path, which matches React Router routes exactly.
 * 3. All Giscus instances can read the canonical path from `window.location` directly,
 *    avoiding any double-normalization issues.
 *
 * @see https://github.com/rafgraph/spa-github-pages
 */
function githubPagesSpaFallbackPlugin(): Plugin {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      const outDir = path.join(projectRoot, 'dist')
      const notFoundPath = path.join(outDir, '404.html')
      const rawBase = process.env.VITE_BASE ?? '/'
      const baseWithSlash =
        rawBase === '/' ? '/' : (rawBase.endsWith('/') ? rawBase : `${rawBase}/`)
      const redirectBaseJson = JSON.stringify(baseWithSlash)

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting…</title>
  <script>
    (function () {
      var l = window.location;
      var encoded = encodeURIComponent(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname + l.search + l.hash
      );
      var base = ${redirectBaseJson};
      window.location.replace(base + '?origin=' + encoded);
    })();
  </script>
</head>
<body>
  <p>Redirecting…</p>
</body>
</html>
`
      fs.writeFileSync(notFoundPath, html, 'utf-8')
      if (process.env.BLOG_BUILD_VERBOSE === '1') {
        console.log('[github-pages-spa-fallback] wrote 404.html')
      }
    },
  }
}

export default defineConfig({
  // Root site deployment. Set VITE_BASE=/repo/ in CI only if deploying to GitHub Pages project site.
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    acceptLanguageCookiePlugin(),
    watchConfigJsonPlugin(),
    compressAssetsPlugin(),
    githubPagesSpaFallbackPlugin(),
    i18nAuditPlugin(),
    virtualPostIndexPlugin(),
  ],
  resolve: {
    alias: {
      '#components': fileURLToPath(new URL('./components', import.meta.url)),
    },
  },
})
