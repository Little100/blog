---
title: 注釈機能デモ
description: 複数行と Markdown レンダリングを探る注釈機能のデモ。
date: 2026-03-28
lastEdited: 2026-03-30
author: Little100
readMinutes: 5
tags: ["機能", "ノート"]
icon: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80"
---

本文は注釈システムの機能をデモします：複数行サポートと Markdown レンダリング。

## 複数行注釈

注釈は複数行にまたがれるようになりました。テキストがカード幅を超えると、自動的に折り返します。

| **形式** | **効果** |
| --- | --- |
| 単一行 | 普通の短い注釈 |
| 複数行长テキスト | **折り返しテキスト**をサポート、各行が自動折り返し |
| Markdown | `**太字**`、`*斜体*`、`` `コード` `` |

上の表は注釈で使用可能な異なる形式オプションを示しています。

## Markdown レンダリング

注釈本文は標準 Markdown 構文をサポートします。下の表は利用可能な機能を示しています：

| 機能 | ユースケース |
| --- | --- |
| 太字 | **bold text** |
| 斜体 | *italic text* |
| インラインコード | `code snippet` |
| リンク | [link](https://example.com) |
| リスト | - item 1<br>- item 2 |

これらの要素はすべて注釈カード内で正しくレンダリングされます。

### 実際の例

実際の注釈を確認するには、このページを下にスクロールしてください。

||{[(This is a paragraph with a single-line annotation.)]}单行: This is a **single-line** annotation with *markdown*.|

||{[(This paragraph has a multi-line annotation.)]}多行: - Bullet point 1
- Bullet point 2
- Bullet point 3

You can also use **bold** and *italic* text together.|

||{[(A code example annotation.)]}代码: Use `inline code` for short snippets, or write longer explanations that wrap to the next line when they exceed the card width.|

||{[(Mixed content annotation.)]}混合: This shows how **bold**, *italic*, and `code` can all appear in the same annotation. Numbered lists (1. 2. 3.) and full Markdown work in the card.|

## ヒントとベストプラクティス

注釈を書く際は以下のガイドラインを覚えておいてください：

- 重要な用語や概念には**太字**を使用
- 軽い強調や外来語には*斜体*を使用
- 技術用語、コマンド、ファイル名には`コード`を使用
- 長い注釈は可読性のために箇条書きに分ける
