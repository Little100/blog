import { GitBranch } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { siteConfig } from '../config/site'

export function UpdateNotice() {
  const { t } = useI18n()

  const updateCfg = (siteConfig as Record<string, unknown>).updates as
    | { enabled: boolean; repo: string }
    | undefined

  if (!updateCfg?.enabled) return null

  const repo = updateCfg.repo ?? 'Little100/blog'
  const changelogUrl = `https://github.com/${repo}/BLOG/main/CHANGELOG.md`
  const releasesUrl = `https://github.com/${repo}/releases`

  return (
    <span className="update-notice">
      <GitBranch size={12} strokeWidth={2} aria-hidden />
      <a
        href={changelogUrl}
        target="_blank"
        rel="noreferrer"
        className="update-notice__link"
        title={t('update.viewChangelog')}
      >
        {t('update.changelog')}
      </a>
      <span className="update-notice__sep" aria-hidden>·</span>
      <a
        href={releasesUrl}
        target="_blank"
        rel="noreferrer"
        className="update-notice__link"
        title={t('update.viewReleases')}
      >
        {t('update.releases')}
      </a>
    </span>
  )
}
