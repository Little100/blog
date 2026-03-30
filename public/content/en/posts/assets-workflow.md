---
title: Image Workflow: Automated Compression and GitHub Size Management
description: One npm command to compress images to WebP: original large files stay out of GitHub, the site still outputs sharp images and controls repo size.
date: 2026-03-27
lastEdited: 2026-03-30
author: Little100
readMinutes: 4
tags: ["tools", "workflow"]
icon: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80"
---

Keep raw large images out of your GitHub repo while the site still outputs sharp WebP images. This post documents the `compress-assets` script and directory conventions.

||{[(This is an annotation outside the code fence, hover or click to show the sidebar number bubble. No label shown when title is empty.)]}|

||{[(Second annotation with a title label, for distinguishing different types of tips.)]}Image Assets|

## End-to-End Flow

```
raw-assets/images/     ← Put your original large images here (don't push)
        ↓
  node scripts/compress-assets.mjs
        ↓
public/assets/images/  ← Compressed WebP output (push to GitHub)
```

Once the directories are set up, compression takes just one command:

```bash
npm run compress
```

Running `npm run compress` automatically:

1. Scans `raw-assets/images/` for new or changed bitmap files.
2. Selects quality presets by format (PNG, JPEG, GIF, etc.).
3. Writes lossy or lossless WebP to `public/assets/images/`.
4. Keeps raw images out of Git, controlling repo size.

| Source format | Output format | Quality | Note |
| ------ | ------ | ---- | ---- |
| PNG    | WebP   | 90%  | Lossless, good for UI assets |
| JPEG   | WebP   | 82%  | Lossy, good for photos |
| WebP   | WebP   | 85%  | Unified quality |
| AVIF   | WebP   | 85%  | Transcode |
| GIF    | WebP   | 85%  | Animated GIFs become single-frame (animation lost) |

<circle-question>
This pipeline converts animated GIFs to single-frame WebP; if animation is critical, save separately or extend the script.
</circle-question>

## One-time Setup

Install Sharp and create the raw assets directory:

```bash
npm install sharp
mkdir raw-assets/images
```

Then put PNG/JPEG/WebP/AVIF/GIF source files in `raw-assets/images/` and run the script.

## Why Not Always Use Unsplash Links?

External links are fine for prototypes; for sites maintained over years, local optimized assets are more stable because:

- External links may change policies, rate-limit, or go offline.
- Self-hosted WebP lets you tune quality per asset type (UI vs. photos).
- CI detecting missing raw asset directories works as a useful safeguard.

## Exclude Raw Files with .gitignore

Ignore the raw directory to avoid accidentally `git add .`-ing multi-megabyte source images:

```gitignore
raw-assets/
```

> If you must version large files, use Git LFS or object storage rather than piling binaries into regular commits.
