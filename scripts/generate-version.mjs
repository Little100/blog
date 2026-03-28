import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function readPkg() {
  const pkgPath = join(ROOT, 'package.json')
  return JSON.parse(readFileSync(pkgPath, 'utf-8'))
}

function gitHash() {
  try {
    const hash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .toString()
      .trim()
    return hash
  } catch {
    return null
  }
}

function parseSemver(v) {
  const parts = v.replace(/^v/, '').split('.')
  return {
    major: parseInt(parts[0] ?? '0', 10),
    minor: parseInt(parts[1] ?? '0', 10),
    patch: parseInt(parts[2] ?? '0', 10),
  }
}

function buildManifest(pkg) {
  const version = pkg.version ?? '0.0.0'
  const { major, minor, patch } = parseSemver(version)
  const buildTime = new Date().toISOString()
  const hash = gitHash()

  return {
    version,
    major,
    minor,
    patch,
    buildTime,
    gitHash: hash,
  }
}

function writeVersionJson(manifest) {
  const destPath = join(ROOT, 'public', 'version.json')
  writeFileSync(
    destPath,
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8',
  )
  console.log(
    `[generate-version] wrote v${manifest.version} → public/version.json  (built ${manifest.buildTime})`,
  )
  if (manifest.gitHash) {
    console.log(`[generate-version] git hash: ${manifest.gitHash}`)
  }
}

const pkg = readPkg()
const manifest = buildManifest(pkg)
writeVersionJson(manifest)
