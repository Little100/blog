import { useEffect, useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import {
  checkForUpdates,
  changelogUrl,
  releasesPageUrl,
  isUpdateAvailable,
  type UpdateStatus,
} from '../data/updater/versionChecker'
import { siteConfig } from '../config/site'
import { useI18nOptional } from '../i18n/I18nContext'
import { STRINGS } from '../i18n/translations'
import { useTheme } from '../theme/ThemeContext'

function tFallback(key: string): string {
  const en = (STRINGS.en as Record<string, string>)[key]
  return en ?? key
}

export function UpdateBanner() {
  const i18n = useI18nOptional()
  const t = (key: string) => (i18n ? i18n.t(key) : tFallback(key))
  const { theme } = useTheme()
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [dismissed, setDismissed] = useState(false)

  const updateCfg = (siteConfig as Record<string, unknown>).updates as
    | { enabled: boolean; repo: string }
    | undefined
  const enabled = updateCfg?.enabled ?? false
  const repo = updateCfg?.repo ?? 'Little100/blog'

  useEffect(() => {
    if (!enabled || dismissed) return

    // Check once on mount
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern: setting intermediate loading state
    setStatus({ state: 'checking' })

    checkForUpdates(repo)
      .then((result) => {
        if (!cancelled) setStatus(result)
      })
      .catch(() => {
        if (!cancelled) setStatus({ state: 'offline' })
      })

    return () => {
      cancelled = true
    }
  }, [enabled, dismissed, repo])

  if (!enabled || dismissed) return null

  // Only show banner when an update is available
  if (!isUpdateAvailable(status)) return null

  const { latest } = status
  const releaseNotes = latest.body
    ? latest.body.slice(0, 140).trim() + (latest.body.length > 140 ? '…' : '')
    : null

  const changelogHref = changelogUrl(repo, latest.tag_name)
  const releasesHref = releasesPageUrl(repo)

  return (
    <div
      className={`update-banner update-banner--${theme}`}
      role="alert"
      aria-live="polite"
    >
      <div className="update-banner__inner">
        <span className="update-banner__icon" aria-hidden>
          <RefreshCw size={14} />
        </span>

        <span className="update-banner__text">
          <strong>v{latest.tag_name.replace(/^v/, '')}</strong>
          {releaseNotes ? (
            <span className="update-banner__note"> — {releaseNotes}</span>
          ) : (
            <span className="update-banner__note">
              {' — '}{t('update.newAvailable')}
            </span>
          )}
        </span>

        <div className="update-banner__actions">
          <a
            href={changelogHref}
            className="update-banner__btn update-banner__btn--changelog"
            target="_blank"
            rel="noreferrer"
          >
            {t('update.viewChangelog')}
          </a>
          <a
            href={releasesHref}
            className="update-banner__btn update-banner__btn--releases"
            target="_blank"
            rel="noreferrer"
          >
            {t('update.viewReleases')}
          </a>
          <button
            type="button"
            className="update-banner__dismiss"
            aria-label={t('update.dismiss')}
            onClick={() => setDismissed(true)}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
