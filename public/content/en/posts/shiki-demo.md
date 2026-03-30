---
title: Shiki Code Highlighting Demo
date: 2026-03-29
lastEdited: 2026-03-30
description: Shiki on-demand syntax highlighting and JSON diagnostics example
tags: [demo, shiki, code]
icon: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80"
excerpt: Shiki on-demand loading, language tags and icons, JSON diagnostic squiggles, custom tooltip popups (not browser-native title).
---

## JSON (invalid syntax, with red squiggles)

```json
1: "1"
```

## JSON (valid)

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

## No language tag (bare fence)

```
This is a block of text with no language tag.
It keeps the monospace font but has no highlighting.
```

## Nested error: JSONC comments

```jsonc
{
  "name": "blog",
  // This is a comment, JSONC allows it
  "version": "0.1.0",
}
```

## Nested error: unclosed object

```json
{
  "name": "blog"
```
