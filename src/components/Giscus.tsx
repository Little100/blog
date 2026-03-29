import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { siteConfig } from '../config/site'

const PLACEHOLDER_REPOS = ['your-username/your-repo', '']

/** Strips the locale prefix (en/ja/zh/zh-TW) from a pathname to produce a stable canonical path. */
function canonicalPath(pathname: string): string {
  return pathname.replace(/^\/(en|ja|zh|zh-TW)/, '') || '/'
}

export function Giscus() {
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const cfg = siteConfig.giscus
    if (!cfg?.enabled || PLACEHOLDER_REPOS.includes(cfg.repo)) return

    // Clear previous iframe so Giscus re-initializes on route change
    if (ref.current) {
      ref.current.innerHTML = ''
    }

    const term = canonicalPath(pathname)

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', cfg.repo)
    script.setAttribute('data-repo-id', cfg.repoId)
    script.setAttribute('data-category', cfg.category)
    script.setAttribute('data-category-id', cfg.categoryId)
    script.setAttribute('data-mapping', 'specific')
    script.setAttribute('data-term', term)
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', cfg.reactionsEnabled)
    script.setAttribute('data-emit-metadata', cfg.emitMetadata)
    script.setAttribute('data-input-position', cfg.inputPosition)
    script.setAttribute('data-theme', 'preferred_color_scheme')
    script.setAttribute('data-lang', cfg.lang)
    script.setAttribute('data-loading', 'lazy')
    script.crossOrigin = 'anonymous'
    script.async = true

    ref.current?.appendChild(script)
  }, [pathname])

  return (
    <div className="giscus-container">
      <div ref={ref} className="giscus" />
    </div>
  )
}
