import { useCallback, useRef, useState, type ComponentProps } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { MdInsidePreProvider } from './MdPreContext'

type PreProps = ComponentProps<'pre'> & { node?: unknown }

export function PreWithCopy(props: PreProps) {
  const { children, className, node: _n, ...rest } = props
  void _n
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const { t } = useI18n()

  const copy = useCallback(async () => {
    const raw = preRef.current?.innerText ?? ''
    try {
      await navigator.clipboard.writeText(raw.endsWith('\n') ? raw.slice(0, -1) : raw)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [])

  return (
    <div className="md-pre-wrap">
      <button type="button" className="md-pre-copy" onClick={copy} aria-label={t('post.copyCode')}>
        {copied ? t('post.copied') : t('post.copyCode')}
      </button>
      <pre ref={preRef} className={`md-pre${className ? ` ${className}` : ''}`} {...rest}>
        <MdInsidePreProvider>{children}</MdInsidePreProvider>
      </pre>
    </div>
  )
}
