---
title: 图片工作流：全自动压缩与 GitHub 体积管理
description: 用一条 npm 命令把图片压成 WebP：原始大图不进入 GitHub，站点仍输出清晰配图并控制仓库体积。
date: 2026-03-27
author: Little100
readMinutes: 4
tags: ["工具", "工作流"]
icon: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80"
---

把原始大图挡在 GitHub 仓库外，同时让站点仍输出清晰的 WebP。本文记录 `compress-assets` 脚本与目录约定。

|{[(这是一条围栏外的批注，鼠标悬停或点击会显示侧栏编号气泡。标题栏为空时不显示标签。)]}|

|{[(第二条批注，带标题标签，用于区分不同类型的提示。)]}图片资产|

## 端到端流程

```
raw-assets/images/     ← 放你的原始大图（不推送）
        ↓
  node scripts/compress-assets.mjs
        ↓
public/assets/images/  ← 压缩后 WebP（推送到 GitHub）
```

准备好目录后，压缩只需一条命令：

```bash
npm run compress
```

执行 `npm run compress` 时会自动完成：

1. 扫描 `raw-assets/images/` 中新增或变更的位图文件。
2. 按格式（PNG、JPEG、GIF 等）选择质量预设。
3. 将有损或无损 WebP 写入 `public/assets/images/`。
4. 不把原始大图纳入 Git，控制仓库体积。

| 原始格式 | 输出格式 | 质量 | 说明 |
| ------ | ------ | ---- | ---- |
| PNG    | WebP   | 90%  | 无损压缩，适合 UI 素材 |
| JPEG   | WebP   | 82%  | 有损压缩，适合照片 |
| WebP   | WebP   | 85%  | 统一质量 |
| AVIF   | WebP   | 85%  | 转码 |
| GIF    | WebP   | 85%  | 动画 GIF 转为单帧（动画不保留）|

<circle-question>
本流水线会把动画 GIF 压成单帧 WebP；若动画是关键素材，请另存或扩展脚本。
</circle-question>

## 一次性准备

安装 Sharp 并创建原稿收件目录：

```bash
npm install sharp
mkdir raw-assets/images
```

然后将 PNG/JPEG/WebP/AVIF/GIF 源文件放进 `raw-assets/images/` 再运行脚本。

## 为什么不一直用 Unsplash 外链？

原型阶段外链无可厚非；若要维护多年的站点，本地优化资源更稳，因为：

- 外链可能改政策、限流或直接失效。
- 自托管 WebP 可按素材类型（界面图 / 照片）分别调质量。
- 在 CI 里检测缺失的原稿目录，可当作有效的防护栏。

## 用 .gitignore 排除原稿

忽略原稿目录，避免手滑 `git add .` 把几兆大的源图推进仓库：

```gitignore
raw-assets/
```

> 若必须把大文件纳入版本历史，请用 Git LFS 或对象存储，而不是把二进制直接堆进普通提交。
