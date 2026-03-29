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
 * Use the rafgraph/spa-github-pages redirect: 404.html sends the browser to `/{base}/?/rest/of/path&query`,
 * then the inline script in index.html calls `history.replaceState` to restore the real URL before the SPA boots.
 * @see https://github.com/rafgraph/spa-github-pages
 */
function githubPagesSpaFallbackPlugin(): Plugin {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      const base = process.env.VITE_BASE ?? '/'
      const trimmed = base.replace(/^\//, '').replace(/\/$/, '')
      const pathSegmentsToKeep = trimmed ? trimmed.split('/').filter(Boolean).length : 0
      const outDir = path.join(projectRoot, 'dist')
      const notFoundPath = path.join(outDir, '404.html')
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting…</title>
  <script>
    var pathSegmentsToKeep = ${pathSegmentsToKeep};
    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
      l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body>
  <p>Redirecting…</p>
  <!-- padding: GitHub Pages SPA 404 redirect; keep file reasonably sized for very old clients -->
</body>
</html>
`
      fs.writeFileSync(notFoundPath, html, 'utf-8')
      console.log(
        `[github-pages-spa-fallback] wrote 404.html (pathSegmentsToKeep=${pathSegmentsToKeep} for base ${JSON.stringify(base)})`,
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
