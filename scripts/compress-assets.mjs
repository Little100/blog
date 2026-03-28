import sharp from 'sharp'
import { readdir, mkdir, rm } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')

const RAW_DIR = join(ROOT, 'raw-assets', 'images')
const OUT_DIR = join(ROOT, 'public', 'assets', 'images')

const EXT_RE = /\.(png|jpe?g|webp|avif|gif)$/i

function toWebpName(file) {
  return basename(file, extname(file).toLowerCase()) + '.webp'
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

async function cleanDir(dir) {
  try {
    await rm(dir, { recursive: true })
  } catch {
  }
  await mkdir(dir, { recursive: true })
}

async function compressPng(src, dst) {
  await sharp(src)
    .webp({ quality: 90, effort: 6, lossless: true })
    .toFile(dst)
  return 'PNG → lossless WebP'
}

async function compressJpeg(src, dst) {
  await sharp(src)
    .webp({ quality: 82, effort: 4 })
    .toFile(dst)
  return 'JPEG → WebP (82%)'
}

async function compressWebp(src, dst) {
  await sharp(src)
    .webp({ quality: 85, effort: 4 })
    .toFile(dst)
  return 'WebP → WebP (85%)'
}

async function compressAvif(src, dst) {
  await sharp(src)
    .webp({ quality: 85, effort: 4 })
    .toFile(dst)
  return 'AVIF → WebP (85%)'
}

async function compressGif(src, dst) {
  await sharp(src, { animated: false })
    .webp({ quality: 85, effort: 4 })
    .toFile(dst)
  return 'GIF → WebP (animation not preserved)'
}

async function processFile(srcFile) {
  const ext = extname(srcFile).toLowerCase()
  const dstFile = join(OUT_DIR, toWebpName(srcFile))

  let note
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
  }
  return { srcFile, dstFile: dstFile.replace(ROOT, ''), note }
}

async function main() {
  const start = Date.now()

  try {
    await readdir(RAW_DIR)
  } catch {
    console.error(`\n❌  Source folder not found: ${RAW_DIR}`)
    console.error('   Create the folder and place your raw images there before running this script.\n')
    process.exit(1)
  }

  await cleanDir(OUT_DIR)

  const files = (await readdir(RAW_DIR)).filter((f) => EXT_RE.test(f))

  if (files.length === 0) {
    console.log('\nℹ️  No images found in raw-assets/images/ — nothing to compress.\n')
    return
  }

  console.log(`\n🗜️  Compressing ${files.length} file(s)…\n`)

  const results = []
  for (const file of files) {
    const src = join(RAW_DIR, file)
    process.stdout.write(`  ${file} … `)
    try {
      const r = await processFile(src)
      results.push(r)
      console.log('✅', r.note)
    } catch (err) {
      console.log('❌', err.message)
      results.push({ srcFile: file, dstFile: null, note: `ERROR: ${err.message}` })
    }
  }

  const ok = results.filter((r) => r.dstFile)
  const fail = results.filter((r) => !r.dstFile)
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log(
    `\n✅  Done in ${elapsed}s  ·  ${ok.length} compressed  ·  ${fail.length} failed\n`,
  )

  if (ok.length > 0) {
    console.log('📋  Markdown snippet to paste into your post:\n')
    console.log('```md')
    for (const r of ok) {
      const relativePath = r.dstFile.replace(/\\/g, '/').replace(/^public\//, '/')
      console.log(`![${basename(r.dstFile, '.webp')}](${relativePath})`)
    }
    console.log('```\n')
  }
}

main().catch((err) => {
  console.error('\n❌  Unexpected error:', err)
  process.exit(1)
})
