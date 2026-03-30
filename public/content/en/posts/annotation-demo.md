---
title: Annotation Feature Demo
description: A demo exploring multi-line and Markdown rendering in the annotation system.
date: 2026-03-28
lastEdited: 2026-03-30
author: Little100
readMinutes: 5
tags: ["feature", "notes"]
icon: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80"
---

This post demonstrates the annotation system's features: multi-line support and Markdown rendering.

## Multi-line Annotations

Annotations can now span multiple lines. When text exceeds the card width, it wraps automatically.

| **Format** | **Effect** |
| --- | --- |
| Single line | Normal short annotation |
| Multi-line long text | Supports **wrapped text**, each line auto-wraps |
| Markdown | `**bold**`, `*italic*`, `` `code` `` |

The table above shows the different formatting options available in annotations.

## Markdown Rendering

Annotation body supports standard Markdown syntax. The table below shows available features:

| Feature | Use case |
| --- | --- |
| Bold | **bold text** |
| Italic | *italic text* |
| Inline code | `code snippet` |
| Links | [link](https://example.com) |
| Lists | - item 1<br>- item 2 |

All these elements render correctly inside annotation cards.

### Live Examples

Scroll down to see actual annotations on this page.

||{[(This is a paragraph with a single-line annotation.)]}Single line: This is a **single-line** annotation with *markdown*.|

||{[(This paragraph has a multi-line annotation.)]}Multi-line: - Bullet point 1
- Bullet point 2
- Bullet point 3

You can also use **bold** and *italic* text together.|

||{[(A code example annotation.)]}Code: Use `inline code` for short snippets, or write longer explanations that wrap to the next line when they exceed the card width.|

||{[(Mixed content annotation.)]}Mixed: This shows how **bold**, *italic*, and `code` can all appear in the same annotation. Numbered lists (1. 2. 3.) and full Markdown work in the card.|

## Tips and Best Practices

Keep these guidelines in mind when writing annotations:

- Use **bold** for key terms and important concepts
- Use *italic* for subtle emphasis or foreign words
- Use `code` for technical terms, commands, or filenames
- Break long annotations into bullet points for better readability
