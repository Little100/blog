---
title: Shiki 代码高亮演示
date: 2026-03-29
lastEdited: 2026-03-30
description: Shiki 按需加载语法高亮与 JSON 诊断示例
tags: [demo, shiki, code]
icon: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80"
excerpt: Shiki 按需加载、语言标签与图标、JSON 波浪线诊断、自定义浮层提示（非浏览器原生 title）。
---

## JSON（无效语法，带红色波浪线）

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

## 无语言标签（裸围栏）

```
这是一段没有任何语言标记的文本。
保持等宽字体，但没有高亮。
```

## 嵌套错误：JSONC 注释

```jsonc
{
  "name": "blog",
  // 这是注释，JSONC 允许
  "version": "0.1.0",
}
```

## 嵌套错误：未闭合的对象

```json
{
  "name": "blog"
```
