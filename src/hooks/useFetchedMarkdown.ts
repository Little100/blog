import { useEffect, useState } from 'react'
import { publicAssetUrl } from '../utils/publicAssetUrl'

type State =
  | { status: 'loading' }
  | { status: 'ok'; text: string }
  | { status: 'error'; message: string }

export function useFetchedMarkdown(url: string): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    fetch(publicAssetUrl(url))
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.text()
      })
      .then((text) => {
        if (!cancelled) setState({ status: 'ok', text })
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : String(e)
          setState({ status: 'error', message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return state
}
