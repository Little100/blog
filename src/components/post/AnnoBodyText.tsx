import type { CSSProperties } from 'react'
import { MarkdownFlow } from '../../markdown/MarkdownFlow'

type Props = {
  text: string
  className?: string
  style?: CSSProperties
}

export function AnnoBodyText({ text, className = '', style }: Props) {
  return (
    <span className={`anno-body-text ${className}`} style={style}>
      <MarkdownFlow content={text} />
    </span>
  )
}
