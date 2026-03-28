export type MarkdownSegment = { kind: 'markdown'; body: string }

export type CalloutTitleSpec =
  | { mode: 'default' }
  | { mode: 'explicit'; text: string }

export type CalloutSegment = {
  kind: 'callout'
  body: string
  icon?: string
  collapsible: boolean
  defaultOpen: boolean
  collapsibleTitle: CalloutTitleSpec
}

export type ZigzagItem = {
  direction: 'img-left' | 'img-right'
  image: string
  text: string
}

export type ZigzagSegment = {
  kind: 'zigzag'
  items: ZigzagItem[]
}

export type DocumentSegment = MarkdownSegment | CalloutSegment | ZigzagSegment
