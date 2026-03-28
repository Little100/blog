import { useMemo } from 'react'
import { MarkdownDocument } from '../markdown/MarkdownDocument'
import { useParsedMarkdown } from '../hooks/useParsedMarkdown'
import { useI18n } from '../i18n/I18nContext'
import { expandMarkdownI18nKeys } from '../utils/i18nKeys'

export function PrivacyPage() {
  const md = useParsedMarkdown('/content/privacy.md')
  const { t } = useI18n()

  const body = useMemo(() => {
    if (md.status !== 'ok') return ''
    return expandMarkdownI18nKeys(md.body, t)
  }, [md, t])

  if (md.status === 'loading') {
    return <p className="page-state">{t('state.loading')}</p>
  }
  if (md.status === 'error') {
    return (
      <p className="page-state page-state--error">
        {t('state.error')}: {md.message}
      </p>
    )
  }

  return (
    <div className="page page--privacy">
      <h1 className="page-hero-title">{t('privacy.title')}</h1>
      <p className="tags-page__lead">{t('privacy.lead')}</p>
      <div className="glass-card contact-card contact-card--full privacy-page__body">
        <MarkdownDocument source={body} />
      </div>
    </div>
  )
}
