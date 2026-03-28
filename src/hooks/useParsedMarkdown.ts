import type { PostMeta } from '../utils/frontmatter'
import { parseFrontmatter } from '../utils/frontmatter'
import { useFetchedMarkdown } from './useFetchedMarkdown'

type State =
  | { status: 'loading' }
  | { status: 'ok'; meta: PostMeta; body: string }
  | { status: 'error'; message: string }

export function useParsedMarkdown(url: string): State {
  const raw = useFetchedMarkdown(url)
  if (raw.status === 'loading') return { status: 'loading' }
  if (raw.status === 'error') return { status: 'error', message: raw.message }
  const { meta, body } = parseFrontmatter(raw.text)
  return { status: 'ok', meta, body }
}
