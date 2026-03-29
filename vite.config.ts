import { execSync } from 'node:child_process'
import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type PreviewServer } from 'vite'
import { compressAssetsPlugin } from './src/vite-plugin/compress-assets'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

function syncPostI18nPlugin(): Plugin {
  const run = () => {
    try {
      execSync('node scripts/sync-post-i18n.mjs', {
        cwd: projectRoot,
        stdio: 'inherit',
      })
    } catch {
      console.warn('[sync-post-i18n] script failed (continuing)')
    }
  }
  return {
    name: 'sync-post-i18n',
    buildStart() {
      run()
    },
    configureServer(server) {
      run()
      const sourceDir = path.join(projectRoot, 'public', 'content', 'source')
      if (fs.existsSync(sourceDir)) {
        server.watcher.add(sourceDir)
      }
      server.watcher.on('change', (file) => {
        const norm = file.split(path.sep).join('/')
        if (norm.includes('/public/content/source/') && norm.endsWith('.md')) {
          run()
        }
      })
    },
  }
}

const COOKIE_NAME = 'BLOG_accept_language'

function attachAcceptLanguageCookie(req: IncomingMessage, res: ServerResponse) {
  const rawUrl = req.url
  if (!rawUrl) {
    return
  }
  const pathname = rawUrl.split('?')[0]
  if (!pathname) {
    return
  }
  if (pathname !== '/' && pathname !== '/index.html') {
    return
  }
  const raw = req.headers['accept-language']
  if (!raw) {
    return
  }
  const headerValue = typeof raw === 'string' ? raw : raw[0]
  if (!headerValue) {
    return
  }
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
      const base = process.env.VITE_BASE ?? '/'
      // Ensure base always ends with / (it's written to the build as the Vite `base` option)
      const baseWithSlash = base.endsWith('/') ? base : base + '/'
      const outDir = path.join(projectRoot, 'dist')
      const notFoundPath = path.join(outDir, '404.html')

      // Encode the original full URL (pathname + search + hash) as `origin` query param.
      // When index.html is served for /nonexistent, l.pathname = /blog/ (base) and
      // l.search = ?origin=https%3A%2F%2Flittle100.github.io%2Fblog%2Fpost%2Fnonexistent
      // After replace: https://little100.github.io/blog/?origin=https://little100.github.io/blog/post/nonexistent
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
      // Replace with ?origin=... pointing to the base path with the encoded original URL.
      // The SPA will pick this up via <Navigate origin={...} /> in App.tsx.
      var target = '${baseWithSlash}' + '?origin=' + encoded;
      window.location.replace(target);
    })();
  </script>
</head>
<body>
  <p>Redirecting…</p>
</body>
</html>
`
      fs.writeFileSync(notFoundPath, html, 'utf-8')
      console.log(
        `[github-pages-spa-fallback] wrote 404.html (base=${JSON.stringify(base)})`,
      )
    },
  }
}

export default defineConfig({
  // GitHub Pages project site: https://user.github.io/repo/ — set VITE_BASE=/repo/ in CI (see deploy workflow).
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    syncPostI18nPlugin(),
    acceptLanguageCookiePlugin(),
    watchConfigJsonPlugin(),
    compressAssetsPlugin(),
    githubPagesSpaFallbackPlugin(),
  ],
  resolve: {
    alias: {
      '#components': fileURLToPath(new URL('./components', import.meta.url)),
    },
  },
})
