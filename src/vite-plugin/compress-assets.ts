import sharp from 'sharp'
import { readdir, mkdir, stat } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')

const RAW_DIR = join(ROOT, 'raw-assets', 'images')
const OUT_DIR = join(ROOT, 'public', 'assets', 'images')

const EXT_RE = /\.(png|jpe?g|webp|avif|gif)$/i

function toWebpName(file: string): string {
  return basename(file, extname(file).toLowerCase()) + '.webp'
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function getFileMtime(path: string): Promise<number> {
  const s = await stat(path)
  return s.mtimeMs
}

async function compressPng(src: string, dst: string): Promise<string> {
  await sharp(src)
    .webp({ quality: 90, effort: 6, lossless: true })
    .toFile(dst)
  return 'PNG → lossless WebP'
}

async function compressJpeg(src: string, dst: string): Promise<string> {
  await sharp(src)
    .webp({ quality: 82, effort: 4 })
    .toFile(dst)
  return 'JPEG → WebP (82%)'
}

async function compressWebp(src: string, dst: string): Promise<string> {
  await sharp(src)
    .webp({ quality: 85, effort: 4 })
    .toFile(dst)
  return 'WebP → WebP (85%)'
}

async function compressAvif(src: string, dst: string): Promise<string> {
  await sharp(src)
    .webp({ quality: 85, effort: 4 })
    .toFile(dst)
  return 'AVIF → WebP (85%)'
}

async function compressGif(src: string, dst: string): Promise<string> {
  await sharp(src, { animated: false })
    .webp({ quality: 85, effort: 4 })
    .toFile(dst)
  return 'GIF → WebP (animation not preserved)'
}

async function processFile(srcFile: string): Promise<{ note: string } | null> {
  const ext = extname(srcFile).toLowerCase()
  const dstFile = join(OUT_DIR, toWebpName(srcFile))

  try {
    const srcMtime = await getFileMtime(srcFile)
    const dstExists = await fileExists(dstFile)
    const dstMtime = dstExists ? await getFileMtime(dstFile) : 0

    if (dstExists && dstMtime >= srcMtime) {
      return null
    }

    let note: string
    if (ext === '.png') {
      note = await compressPng(srcFile, dstFile)
    } else if (ext === '.jpg' || ext === '.jpeg') {
      note = await compressJpeg(srcFile, dstFile)
    } else if (ext === '.webp') {
      note = await compressWebp(srcFile, dstFile)
    } else if (ext === '.avif') {
      note = await compressAvif(srcFile, dstFile)
    } else if (ext === '.gif') {
      note = await compressGif(srcFile, dstFile)
    } else {
      return null
    }

    console.log(`  [compress] ${basename(srcFile)} → ${note}`)
    return { note }
  } catch (err) {
    console.error(`  [compress] Failed to process ${srcFile}: ${(err as Error).message}`)
    return null
  }
}

async function compressAll(): Promise<void> {
  try {
    const files = (await readdir(RAW_DIR)).filter((f) => EXT_RE.test(f))
    if (files.length === 0) return

    await ensureDir(OUT_DIR)
    for (const file of files) {
      await processFile(join(RAW_DIR, file))
    }
  } catch {
  }
}

export function compressAssetsPlugin(): Plugin {
  let watching = false

  return {
    name: 'compress-assets',

    buildStart() {
      if (watching) return
      watching = true
      compressAll()
    },

    configureServer(server) {
      const sourceDir = join(ROOT, 'raw-assets', 'images')

      server.watcher.add(sourceDir)

      server.watcher.on('change', async (file) => {
        const norm = file.split('\\').join('/')
        if (norm.includes('/raw-assets/images/') && EXT_RE.test(norm)) {
          console.log(`\n🖼️  Image changed: ${basename(file)}`)
          await ensureDir(OUT_DIR)
          await processFile(file)
          console.log('')
        }
      })

      server.watcher.on('add', async (file) => {
        const norm = file.split('\\').join('/')
        if (norm.includes('/raw-assets/images/') && EXT_RE.test(norm)) {
          console.log(`\n🖼️  New image detected: ${basename(file)}`)
          await ensureDir(OUT_DIR)
          await processFile(file)
          console.log('')
        }
      })
    },
  }
}
