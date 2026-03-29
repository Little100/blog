import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

/**
 * Reads `?origin=...` from the redirect landing page and navigates to the real path
 * using React Router's <Navigate>.  This ensures the URL matches React Router's routes
 * exactly, so Giscus gets the correct pathname and blog-list/post routes are not
 * confused by a malformed URL.
 *
 * Placed at the top of App's `<Routes>` before any page routes.
 */
export function SpaOriginRedirect() {
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
      const stored = sessionStorage.getItem('__spa_origin__')
      if (stored) {
        sessionStorage.removeItem('__spa_origin__')
        // `stored` is the decoded pathname+search+hash of the original URL,
        // already stripped of the protocol/host (e.g. "/blog/post/nonexistent").
        setTarget(stored)
      }
  }, [])

  if (!target) return null

  return <Navigate to={target} replace />
}
