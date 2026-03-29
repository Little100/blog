import { Fragment } from 'react'
import { publicAssetUrl } from '../utils/publicAssetUrl'
import { splitByCustomBlocks } from '../extensions/customBlockSpecs'
import type { DocumentSegment, ZigzagItem } from './segmentTypes'
import { MarkdownFlow } from './MarkdownFlow'
import { CalloutBlock } from '../components/blocks/CalloutBlock'
import type { CalloutSegment, ZigzagSegment } from './segmentTypes'

function ZigzagBlock({ items }: { items: ZigzagItem[] }) {
  return (
    <div className="md-zigzag-block">
      {items.map((item, idx) => (
        <div key={idx} className={`md-zigzag-item md-zigzag-item--${item.direction}`}>
          <div className="md-zigzag-item__image">
            <ImageFromMarkdown src={item.image} />
          </div>
          <div className="md-zigzag-item__text">
            <MarkdownFlow content={item.text} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ImageFromMarkdown({ src: markdownImg }: { src: string }) {
  const match = markdownImg.match(/!\[(.*?)\]\(([^)\s]+)\)/)
  if (!match) return null
  const [, alt, src] = match
  return <img className="md-img" src={publicAssetUrl(src)} alt={alt} loading="lazy" />
}

function renderSegment(seg: DocumentSegment, index: number, enableMediaZigzag?: boolean) {
  if (seg.kind === 'markdown') {
    return <MarkdownFlow key={`md-${index}`} content={seg.body} enableMediaZigzag={enableMediaZigzag} />
  }
  if (seg.kind === 'zigzag') {
    return <ZigzagBlock key={`zigzag-${index}`} items={(seg as ZigzagSegment).items} />
  }
  const cs = seg as CalloutSegment
  return (
    <CalloutBlock
      key={`callout-${index}`}
      body={cs.body}
      icon={cs.icon}
      collapsible={cs.collapsible}
      defaultOpen={cs.defaultOpen}
      collapsibleTitle={cs.collapsibleTitle}
    />
  )
}

type Props = {
  source: string
  enableMediaZigzag?: boolean
}

export function MarkdownDocument({ source, enableMediaZigzag }: Props) {
  const segments = splitByCustomBlocks(source)

  return (
    <div className="md-document">
      {segments.map((seg, i) => (
        <Fragment key={i}>{renderSegment(seg, i, enableMediaZigzag)}</Fragment>
      ))}
    </div>
  )
}
