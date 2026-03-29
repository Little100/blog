import { type ComponentProps } from 'react'
import type { Components } from 'react-markdown'
import type { PluggableList } from 'unified'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { defaultSchema } from 'rehype-sanitize'
import { MarkdownFenceBlock } from './MarkdownFenceBlock'
import { useMdInsidePre } from './MdPreContext'
import { AnnotationAnchor } from '../components/post/AnnotationAnchor'

interface MarkdownCodeProps extends ComponentProps<'code'> {
  node?: unknown
}

function MarkdownCode(props: MarkdownCodeProps) {
  const { className, children, node: _node, ...rest } = props
  void _node
  const insidePre = useMdInsidePre()
  if (insidePre) {
    const merged = [className, 'md-code--block'].filter(Boolean).join(' ').trim()
    return (
      <code className={merged} {...rest}>
        {children}
      </code>
    )
  }
  if (!className) {
    return (
      <code className="md-code md-code--inline" {...rest}>
        {children}
      </code>
    )
  }
  return (
    <code className={`${className} md-code--block`.trim()} {...rest}>
      {children}
    </code>
  )
}

const markdownComponents: Components = {
  h1: (props) => <h1 className="md-h1" {...props} />,
  h2: (props) => <h2 className="md-h2" {...props} />,
  h3: (props) => <h3 className="md-h3" {...props} />,
  p: (props) => <p className="md-p" {...props} />,
  a: (props) => <a className="md-a" target="_blank" rel="noreferrer" {...props} />,
  ul: (props) => <ul className="md-ul" {...props} />,
  ol: (props) => <ol className="md-ol" {...props} />,
  li: (props) => <li className="md-li" {...props} />,
  blockquote: (props) => <blockquote className="md-bq" {...props} />,
  code: (props) => <MarkdownCode {...props} />,
  pre: (props) => <MarkdownFenceBlock {...props} />,
  img: ({ className, alt, ...props }) => (
    <img className={`md-img${className ? ` ${className}` : ''}`} loading="lazy" alt={alt ?? ''} {...props} />
  ),
  hr: (props) => <hr className="md-hr" {...props} />,
  span: (props) => {
    if (props.className === 'md-anno') {
      return <AnnotationAnchor {...props} />
    }
    return <span {...props} />
  },
  table: (props) => <table className="md-table" {...props} />,
  th: (props) => <th className="md-th" {...props} />,
  td: (props) => <td className="md-td" {...props} />,
}

const sanitizeSchema = {
  ...defaultSchema,
  clobber: ['ariaDescribedBy', 'ariaLabelledBy', 'name'],
  tagNames: [...(defaultSchema.tagNames ?? []), 'span'],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...((defaultSchema.attributes?.['*']) ?? []), 'dataAnnoIndex'],
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    img: [...(defaultSchema.attributes?.img ?? []), 'src', 'alt', 'title', 'loading'],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      'className',
      'class',
      'id',
      'dataAnnoIndex',
      'dataAnnoTone',
    ],
    div: [
      ...(defaultSchema.attributes?.div ?? []),
    ],
  },
}

export const markdownRemarkPlugins: PluggableList = [remarkGfm]

export function buildMarkdownRehypePlugins(): PluggableList {
  return [rehypeRaw, [rehypeSanitize, sanitizeSchema]]
}

export { markdownComponents }
