/**
 * The Vite base path, consistent with the `base` option in vite.config.ts.
 * Strip this prefix from window.location.pathname before any locale or route matching.
 */
export const VITE_BASE: string = import.meta.env.BASE_URL ?? '/'

/**
 * Strips the Vite base path prefix from a pathname.
 * E.g. stripBasePath('/blog/en/post/xxx') → '/en/post/xxx'
 *      stripBasePath('/en/post/xxx')      → '/en/post/xxx' (dev, no base)
 */
export function stripBasePath(pathname: string): string {
  if (VITE_BASE === '/') return pathname
  return pathname.startsWith(VITE_BASE)
    ? pathname.slice(VITE_BASE.length) || '/'
    : pathname
}
