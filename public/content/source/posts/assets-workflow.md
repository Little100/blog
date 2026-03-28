---
title: post.assets-workflow.title
description: post.assets-workflow.seoDescription
date: 2026-03-27
author: Little100
readMinutes: 4
tags: ["post.assets-workflow.tag.tools", "post.assets-workflow.tag.workflow"]
icon: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80"
---

post.assets-workflow.intro
|{[(post.assets-workflow.anno.intro.demo.body)]}||
|{[(post.assets-workflow.anno.intro.demo2.body)]}|post.assets-workflow.anno.intro.demo2.title|

## post.assets-workflow.h2.workflow

```
raw-assets/images/     ← 放你的原始大图（不推送）
        ↓
  node scripts/compress-assets.mjs
        ↓
public/assets/images/  ← 压缩后 WebP（推送到 GitHub）
```

post.assets-workflow.oneCommandLead

```bash
npm run compress
```

post.assets-workflow.autoIntro

1. post.assets-workflow.auto.1
2. post.assets-workflow.auto.2
3. post.assets-workflow.auto.3
4. post.assets-workflow.auto.4

| 原始格式 | 输出格式 | 质量 | 说明 |
| ------ | ------ | ---- | ---- |
| PNG    | WebP   | 90%  | 无损压缩，适合 UI 素材 |
| JPEG   | WebP   | 82%  | 有损压缩，适合照片 |
| WebP   | WebP   | 85%  | 统一质量 |
| AVIF   | WebP   | 85%  | 转码 |
| GIF    | WebP   | 85%  | 动画 GIF 转为单帧（动画不保留）|

<circle-question>
post.assets-workflow.callout.gif
</circle-question>

## post.assets-workflow.h2.setup

post.assets-workflow.setup.lead

```bash
npm install sharp
mkdir raw-assets/images
```

post.assets-workflow.setup.footer

## post.assets-workflow.h2.whyNotUnsplash

post.assets-workflow.why.lead

- post.assets-workflow.why.b1
- post.assets-workflow.why.b2
- post.assets-workflow.why.b3

## post.assets-workflow.h2.gitignore

post.assets-workflow.gitignore.lead

```gitignore
raw-assets/
```

> post.assets-workflow.blockquote.lfs
