import { useEffect, useState } from 'react'
import { GitBranch, Tag, Calendar } from 'lucide-react'
import { fetchAllReleases, repoUrl, releasesPageUrl, type ReleaseInfo } from '../data/updater/versionChecker'
import { siteConfig } from '../config/site'
import { useI18n } from '../i18n/I18nContext'

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function ReleaseBody({ body }: { body: string }) {
  if (!body) return null
  const lines = body.split('\n')
  return (
    <div className="changelog-body">
      {lines
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => {
          const isList = line.startsWith('-') || line.startsWith('*')
          const isH = line.startsWith('## ') || line.startsWith('### ')
          if (isH) {
            return (
              <h4 key={idx} className="changelog-h">
                {line.replace(/^#{1,3}\s*/, '')}
              </h4>
            )
          }
          if (isList) {
            return (
              <li key={idx} className="changelog-li">
                {line.replace(/^[-*]\s*/, '')}
              </li>
            )
          }
          return (
            <p key={idx} className="changelog-p">
              {line
                .replace(/\*\*(.*?)\*\*/g, (_, m) => m)
                .replace(/`([^`]+)`/g, (_, m) => m)}
            </p>
          )
        })}
    </div>
  )
}

type ChangelogState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; releases: ReleaseInfo[]; repo: string }

export function ChangelogPage() {
  const { t, locale } = useI18n()
  const [state, setState] = useState<ChangelogState>({ status: 'loading' })

  const updateCfg = (siteConfig as Record<string, unknown>).updates as
    | { enabled: boolean; repo: string }
    | undefined
  const repo = updateCfg?.repo ?? 'Little100/blog'

  useEffect(() => {
    let cancelled = false
    fetchAllReleases(repo)
      .then((releases) => {
        if (!cancelled) setState({ status: 'ok', releases, repo })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err)
          setState({ status: 'error', message: msg })
        }
      })
    return () => {
      cancelled = true
    }
  }, [repo])

  return (
    <div className="page changelog-page">
      <div className="changelog-header">
        <h1 className="page-title changelog-title">{t('changelog.title')}</h1>
        <p className="changelog-lead">{t('changelog.lead')}</p>
        <div className="changelog-header-links">
          <a
            href={repoUrl(repo)}
            target="_blank"
            rel="noreferrer"
            className="changelog-ext-link"
          >
            <GitBranch size={15} aria-hidden />
            {t('changelog.viewRepo')}
          </a>
          <a
            href={releasesPageUrl(repo)}
            target="_blank"
            rel="noreferrer"
            className="changelog-ext-link"
          >
            <Tag size={15} aria-hidden />
            {t('changelog.allReleases')}
          </a>
        </div>
      </div>

      {state.status === 'loading' && (
        <p className="page-state">{t('state.loading')}</p>
      )}

      {state.status === 'error' && (
        <p className="page-state page-state--error">
          {t('changelog.loadError')}: {state.message}
        </p>
      )}

      {state.status === 'ok' && (
        <>
          {state.releases.length === 0 ? (
            <p className="page-state">{t('changelog.empty')}</p>
          ) : (
            <ol className="changelog-list">
              {state.releases.map((release) => {
                const tag = release.tag_name.replace(/^v/, '')
                const dateStr = formatDate(release.published_at, locale === 'zh' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : locale === 'ja' ? 'ja-JP' : 'en-US')

                return (
                  <li key={release.tag_name} className="changelog-entry">
                    <div className="changelog-entry__meta">
                      <span className="changelog-tag">
                        <GitBranch size={13} aria-hidden />
                        {tag}
                      </span>
                      {release.name && release.name !== release.tag_name && (
                        <span className="changelog-name">{release.name}</span>
                      )}
                      <span className="changelog-date">
                        <Calendar size={12} aria-hidden />
                        {dateStr}
                      </span>
                      {release.isPrerelease && (
                        <span className="changelog-badge changelog-badge--pre">
                          {t('changelog.pre')}
                        </span>
                      )}
                    </div>

                    <ReleaseBody body={release.body} />

                    <a
                      href={release.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="changelog-permalink"
                    >
                      {t('changelog.viewOnGithub')}
                    </a>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      )}
    </div>
  )
}
