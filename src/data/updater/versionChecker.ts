export type VersionInfo = {
  version: string
}

export type ReleaseInfo = {
  tag_name: string
  name: string
  html_url: string
  body: string
  published_at: string
  isDraft: boolean
  isPrerelease: boolean
}

export type UpdateAvailable = {
  hasUpdate: true
  current: VersionInfo
  latest: ReleaseInfo
}

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'up-to-date'; info: VersionInfo }
  | { state: 'offline' }
  | UpdateAvailable
  | { state: 'error'; message: string }

function parseSemver(v: string): { major: number; minor: number; patch: number } {
  const parts = v.replace(/^v/, '').split('.')
  return {
    major: parseInt(parts[0] ?? '0', 10),
    minor: parseInt(parts[1] ?? '0', 10),
    patch: parseInt(parts[2] ?? '0', 10),
  }
}

function isNewer(
  current: { major: number; minor: number; patch: number },
  latest: { major: number; minor: number; patch: number },
): boolean {
  if (latest.major > current.major) return true
  if (latest.major < current.major) return false
  if (latest.minor > current.minor) return true
  if (latest.minor < current.minor) return false
  return latest.patch > current.patch
}

import { publicAssetUrl } from '../../utils/publicAssetUrl'

const GH_API = 'https://api.github.com'
const GH_HEADERS: HeadersInit = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

async function fetchLatestRelease(repo: string): Promise<ReleaseInfo> {
  const res = await fetch(`${GH_API}/repos/${repo}/releases/latest`, {
    headers: GH_HEADERS,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status}: ${body}`)
  }

  return res.json() as Promise<ReleaseInfo>
}

export async function checkForUpdates(repo: string): Promise<UpdateStatus> {
  let versionInfo: VersionInfo

  try {
    const res = await fetch(
      publicAssetUrl('/version.json') + '?t=' + Date.now(),
      { cache: 'no-store' },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    versionInfo = { version: text.trim() }
  } catch {
    return { state: 'offline' }
  }

  let latestRelease: ReleaseInfo
  try {
    latestRelease = await fetchLatestRelease(repo)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { state: 'error', message: msg }
  }

  if (latestRelease.isDraft || latestRelease.isPrerelease) {
    return { state: 'up-to-date', info: versionInfo }
  }

  const currentParsed = parseSemver(versionInfo.version)
  const latestParsed = parseSemver(latestRelease.tag_name)

  if (isNewer(currentParsed, latestParsed)) {
    return {
      hasUpdate: true,
      current: versionInfo,
      latest: latestRelease,
    }
  }

  return { state: 'up-to-date', info: versionInfo }
}

export function changelogUrl(repo: string, tagName: string): string {
  const tag = tagName.replace(/^v/, '')
  return `https://github.com/${repo}/blog/${tag}/CHANGELOG.md`
}

export function releasesPageUrl(repo: string): string {
  return `https://github.com/${repo}/releases`
}

export async function fetchAllReleases(repo: string, perPage = 30): Promise<ReleaseInfo[]> {
  const res = await fetch(
    `${GH_API}/repos/${repo}/releases?per_page=${perPage}`,
    { headers: GH_HEADERS },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status}: ${body}`)
  }
  return res.json() as Promise<ReleaseInfo[]>
}

export function repoUrl(repo: string): string {
  return `https://github.com/${repo}`
}

export function isUpdateAvailable(s: UpdateStatus): s is UpdateAvailable {
  return 'hasUpdate' in s && (s as UpdateAvailable).hasUpdate === true
}
