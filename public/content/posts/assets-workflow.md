---
  title: post.assets-workflow.title
  description: post.assets-workflow.description
  date: 2026-03-27
  author: Little100
  readMinutes: 4
  tags: ["post.assets-workflow.tag.工具","post.assets-workflow.tag.工作流"]
  icon: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80"
---

post.assets-workflow.p0

|{[(post.assets-workflow.annotation.body)]}|

|{[(post.assets-workflow.annotation.body1)]}post.assets-workflow.annotation.title1|

## post.assets-workflow.section.端到端流程

```
raw-assets/images/     ← 放你的原始大图（不推送）
        ↓
  node scripts/compress-assets.mjs
        ↓
public/assets/images/  ← 压缩后 WebP（推送到 GitHub）
```

post.assets-workflow.p1

```bash
npm run compress
```

post.assets-workflow.p2

post.assets-workflow.p3
post.assets-workflow.p4
post.assets-workflow.p5
post.assets-workflow.p6

| 原始格式 | 输出格式 | 质量 | 说明 |
| ------ | ------ | ---- | ---- |
| PNG    | WebP   | 90%  | 无损压缩，适合 UI 素材 |
| JPEG   | WebP   | 82%  | 有损压缩，适合照片 |
| WebP   | WebP   | 85%  | 统一质量 |
| AVIF   | WebP   | 85%  | 转码 |
| GIF    | WebP   | 85%  | 动画 GIF 转为单帧（动画不保留）|

<circle-question>
post.assets-workflow.p7
</circle-question>

## post.assets-workflow.section.一次性准备

post.assets-workflow.p8

```bash
npm install sharp
mkdir raw-assets/images
```

post.assets-workflow.p9

## post.assets-workflow.section.为什么不一直用.unsplash.外链.

post.assets-workflow.p10

post.assets-workflow.p11
post.assets-workflow.p12
post.assets-workflow.p13

## post.assets-workflow.section.用.gitignore.排除原稿

post.assets-workflow.p14

```gitignore
raw-assets/
```

> post.assets-workflow.pullquote

