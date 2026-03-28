---
title: 批注功能演示
description: 探索多行和 Markdown 渲染的批注功能演示。
date: 2026-03-28
author: Little100
readMinutes: 5
tags: ["功能", "笔记"]
icon: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80"
---

本文演示批注系统的功能：多行支持和 Markdown 渲染。

## 多行批注

批注现在可以跨越多行。当文本超过卡片宽度时，会自动换行。

| **格式** | **效果** |
| --- | --- |
| 单行 | 普通短批注 |
| 多行 | 支持**换行文本**，每行自动换行 |
| Markdown | `**加粗**`、`*斜体*`、`` `代码` `` |

上表显示了批注中可用的不同格式选项。

## Markdown 渲染

批注正文支持标准 Markdown 语法。下表显示了可用的功能：

| 功能 | 示例 |
| --- | --- |
| 加粗 | `**bold text**` |
| 斜体 | `*italic text*` |
| 行内代码 | `` `code snippet` `` |
| 链接 | `[link](https://...)` |
| 列表 | `- item 1\n- item 2` |

所有这些元素都可在批注卡内正确渲染。

### 实际示例

向下滚动查看本页上的实际批注。

|This is a paragraph with a single-line annotation. |{[(This is a **single-line** annotation with *markdown*.)]}|单行|

|This paragraph has a multi-line annotation. |{[(This annotation spans multiple lines to show how longer text wraps naturally within the card.

- Bullet point 1
- Bullet point 2
- Bullet point 3

You can also use **bold** and *italic* text together.)]}|多行|

|A code example annotation. |{[(Use `inline code` for short snippets, or write longer explanations that wrap to the next line when they exceed the card width.)]}|代码|

|Mixed content annotation. |{[(This shows how **bold**, *italic*, and `code` can all appear in the same annotation.

You can even write multiple paragraphs.

1. First item
2. Second item
3. Third item

All rendered with proper Markdown formatting.)]}|混合|

## 提示与最佳实践

编写批注时请记住以下准则：

- 对关键术语和重要概念使用**加粗**
- 使用*斜体*进行轻微强调或外来词
- 对技术术语、命令或文件名使用`代码`
- 将长批注分成要点以提高可读性
