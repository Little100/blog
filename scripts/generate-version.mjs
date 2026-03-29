import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
const version = pkg.version ?? '0.0.0'

writeFileSync(join(ROOT, 'public', 'version.json'), `${version}\n`, 'utf-8')
console.log(`[generate-version] wrote ${version} → public/version.json`)
