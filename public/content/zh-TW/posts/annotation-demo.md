---
title: 批註功能示範
description: 探索多行和 Markdown 渲染的批註功能示範。
date: 2026-03-28
lastEdited: 2026-03-30
author: Little100
readMinutes: 5
tags: ["功能", "筆記"]
icon: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80"
---

本文演示批註系統的功能：多行支援和 Markdown 渲染。

## 多行批註

批註現在可以跨越多行。當文字超過卡片寬度時，會自動換行。

| **格式** | **效果** |
| --- | --- |
| 單行 | 普通短批註 |
| 多行長文字 | 支援**換行文字**，每行自動換行 |
| Markdown | `**粗體**`、`*斜體*`、`` `程式碼` `` |

上表顯示了批註中可用的不同格式選項。

## Markdown 渲染

批註正文支援標準 Markdown 語法。下表顯示了可用的功能：

| 功能 | 用例 |
| --- | --- |
| 粗體 | **bold text** |
| 斜體 | *italic text* |
| 行內程式碼 | `code snippet` |
| 連結 | [link](https://example.com) |
| 列表 | - item 1<br>- item 2 |

所有這些元素都可在批註卡內正確渲染。

### 實際示例

向下滾動查看本頁上的實際批註。

||{[(This is a paragraph with a single-line annotation.)]}单行: This is a **single-line** annotation with *markdown*.|

||{[(This paragraph has a multi-line annotation.)]}多行: - Bullet point 1
- Bullet point 2
- Bullet point 3

You can also use **bold** and *italic* text together.|

||{[(A code example annotation.)]}代码: Use `inline code` for short snippets, or write longer explanations that wrap to the next line when they exceed the card width.|

||{[(Mixed content annotation.)]}混合: This shows how **bold**, *italic*, and `code` can all appear in the same annotation. Numbered lists (1. 2. 3.) and full Markdown work in the card.|

## 提示與最佳實踐

撰寫批註時請記住以下準則：

- 對關鍵術語和重要概念使用**粗體**
- 使用*斜體*進行輕微強調或外來詞
- 對技術術語、命令或檔案名使用`程式碼`
- 將長批註分成要點以提高可讀性
