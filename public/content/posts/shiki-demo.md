---
  title: post.shiki-demo.title
  date: 2026-03-29
  description: post.shiki-demo.description
  tags: []
  icon: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80"
  excerpt: post.shiki-demo.excerpt
---

## post.shiki-demo.section.json.无效语法.带红色波浪线.

```json
1: "1"
```

## post.shiki-demo.section.json.有效.

```json
{
  "name": "blog",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite"
  }
}
```

## post.shiki-demo.section.typescript

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

## post.shiki-demo.section.python

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

## post.shiki-demo.section.bash

```bash
npm install shiki
npm run build
git push origin main
```

## post.shiki-demo.section.无语言标签（裸围栏）

```
这是一段没有任何语言标记的文本。
保持等宽字体，但没有高亮。
```

## post.shiki-demo.section.嵌套错误.jsonc.注释

```jsonc
{
  "name": "blog",
  // 这是注释，JSONC 允许
  "version": "0.1.0",
}
```

## post.shiki-demo.section.嵌套错误：未闭合的对象

```json
{
  "name": "blog"

```

