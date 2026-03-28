import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  buildMarkdownRehypePlugins,
  markdownComponents,
  markdownRemarkPlugins,
} from './markdownConfig'

type Props = {
  content: string
  enableMediaZigzag?: boolean
}

export function MarkdownFlow({ content, enableMediaZigzag: _enableMediaZigzag = false }: Props) {
  const rehypePlugins = useMemo(() => buildMarkdownRehypePlugins(), [])

  if (!content.trim()) return null

  return (
    <ReactMarkdown
      remarkPlugins={markdownRemarkPlugins}
      rehypePlugins={rehypePlugins}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  )
}
