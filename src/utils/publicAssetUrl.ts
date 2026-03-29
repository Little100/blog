/**
 * Resolves URLs for files served from Vite `public/` (e.g. `/content/...`, `/version.json`).
 * Uses `import.meta.env.BASE_URL` so GitHub Pages project sites (`/repo/`) load correctly.
 */
export function publicAssetUrl(path: string): string {
  const t = path.trim()
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('data:')) {
    return path
  }
  if (!t.startsWith('/')) {
    return path
  }
  const base = import.meta.env.BASE_URL
  const trimmed = t.startsWith('/') ? t.slice(1) : t
  return `${base}${trimmed}`
}
