---
title: 圖片工作流：全自動壓縮與 GitHub 體積管理
description: 用一條 npm 命令把圖片壓成 WebP：原始大圖不進入 GitHub，站點仍輸出清晰配圖並控制倉庫體積。
date: 2026-03-27
lastEdited: 2026-03-30
author: Little100
readMinutes: 4
tags: ["工具", "工作流"]
icon: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80"
---

把原始大圖擋在 GitHub 倉庫外，同時讓站點仍輸出清晰的 WebP。本文記錄 `compress-assets` 腳本與目錄約定。

||{[(這是一條圍欄外的批註，鼠標懸停或點擊會顯示側欄編號氣泡。標題欄為空時不顯示標籤。)]}|

||{[(第二條批註，帶標題標籤，用於區分不同類型的提示。)]}圖片資產|

## 端到端流程

```
raw-assets/images/     ← 放你的原始大圖（不推送）
        ↓
  node scripts/compress-assets.mjs
        ↓
public/assets/images/  ← 壓縮後 WebP（推送到 GitHub）
```

準備好目錄後，壓縮只需一條命令：

```bash
npm run compress
```

執行 `npm run compress` 時會自動完成：

1. 掃描 `raw-assets/images/` 中新增或變更的點陣圖文件。
2. 按格式（PNG、JPEG、GIF 等）選擇質量預設。
3. 將有損或無損 WebP 寫入 `public/assets/images/`。
4. 不把原始大圖納入 Git，控制倉庫體積。

| 原始格式 | 輸出格式 | 質量 | 說明 |
| ------ | ------ | ---- | ---- |
| PNG    | WebP   | 90%  | 無損壓縮，適合 UI 素材 |
| JPEG   | WebP   | 82%  | 有損壓縮，適合照片 |
| WebP   | WebP   | 85%  | 統一質量 |
| AVIF   | WebP   | 85%  | 轉碼 |
| GIF    | WebP   | 85%  | 動畫 GIF 轉為單幀（動畫不保留）|

<circle-question>
本流水線會把動畫 GIF 壓成單幀 WebP；若動畫是關鍵素材，請另存或擴展腳本。
</circle-question>

## 一次性準備

安裝 Sharp 並建立原稿收件目錄：

```bash
npm install sharp
mkdir raw-assets/images
```

然後將 PNG/JPEG/WebP/AVIF/GIF 源文件放進 `raw-assets/images/` 再運行腳本。

## 為什麼不一直用 Unsplash 外鏈？

原型階段外鏈無可厚非；若要維護多年的站點，本地優化資源更穩，因為：

- 外鏈可能改政策、限流或直接失效。
- 自托管 WebP 可按素材類型（介面圖 / 照片）分別調質量。
- 在 CI 裡檢測缺失的原稿目錄，可當作有效的防護欄。

## 用 .gitignore 排除原稿

忽略原稿目錄，避免手滑 `git add .` 把幾兆大的源圖推進倉庫：

```gitignore
raw-assets/
```

> 若必須把大文件納入版本歷史，請用 Git LFS 或對象存儲，而不是把二進制直接堆進普通提交。
