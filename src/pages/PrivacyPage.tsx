import { MarkdownDocument } from '../markdown/MarkdownDocument'
import { useParsedMarkdown } from '../hooks/useParsedMarkdown'
import { useI18n } from '../i18n/I18nContext'

export function PrivacyPage() {
  const { locale, t } = useI18n()
  const md = useParsedMarkdown(`/content/${locale}/privacy.md`)

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
        <MarkdownDocument source={md.body} />
      </div>
    </div>
  )
}
