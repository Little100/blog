---
title: Shiki コードハイライトデモ
date: 2026-03-29
lastEdited: 2026-03-30
description: Shiki オンデマンド構文ハイライトと JSON 診断の例
tags: [demo, shiki, code]
icon: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80"
excerpt: Shiki オンデマンドローディング、言語タグとアイコン、JSON 波線診断、カスタムツールチップポップアップ（ブラウザ原生 title ではない）。
---

## JSON（無効な構文、赤い波線付き）

```json
1: "1"
```

## JSON（有効）

```json
{
  "name": "blog",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite"
  }
}
```

## TypeScript

```ts
interface User {
  id: number
  name: string
  email?: string
}

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) throw new Error('User not found')
  return res.json()
}
```

## Python

```python
def fibonacci(n: int) -> list[int]:
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print(fibonacci(10))
```

## Bash

```bash
npm install shiki
npm run build
git push origin main
```

## 言語タグなし（ベアフェンス）

```
これは言語タグのないテキストブロックです。
等幅フォントは保持しますが、ハイライトはありません。
```

## ネストエラー：JSONC コメント

```jsonc
{
  "name": "blog",
  // これはコメント、JSONC はこれを許可します
  "version": "0.1.0",
}
```

## ネストエラー：閉じ括弧のないオブジェクト

```json
{
  "name": "blog"
```
