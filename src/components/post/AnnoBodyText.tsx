import type { CSSProperties } from 'react'
import { MarkdownFlow } from '../../markdown/MarkdownFlow'

type Props = {
  text: string
  className?: string
  style?: CSSProperties
}

/** GFM collapses single newlines in paragraphs; turn them into Markdown hard breaks. */
function newlinesToHardBreaks(md: string): string {
  if (!md.includes('\n')) return md
  return md
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('  \n')
}

export function AnnoBodyText({ text, className = '', style }: Props) {
  const content = newlinesToHardBreaks(text)
  return (
    <span className={`anno-body-text ${className}`} style={style}>
      <MarkdownFlow content={content} />
    </span>
  )
}
