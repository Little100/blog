---
title: Shiki 程式碼高亮示範
date: 2026-03-29
lastEdited: 2026-03-30
description: Shiki 按需載入語法高亮與 JSON 診斷範例
tags: [demo, shiki, code]
icon: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80"
excerpt: Shiki 按需載入、語言標籤與圖示、JSON 波紋線診斷、自訂浮層提示（非瀏覽器原生 title）。
---

## JSON（無效語法，帶紅色波紋線）

```json
1: "1"
```

## JSON（有效）

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

## 無語言標籤（裸圍欄）

```
這是一段沒有任何語言標記的文字。
保持等寬字體，但沒有高亮。
```

## 嵌套錯誤：JSONC 註釋

```jsonc
{
  "name": "blog",
  // 這是註釋，JSONC 允許
  "version": "0.1.0",
}
```

## 嵌套錯誤：未閉合的物件

```json
{
  "name": "blog"
```
