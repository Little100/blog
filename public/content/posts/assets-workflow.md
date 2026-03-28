---
  title: post.assets-workflow.title
  description: post.assets-workflow.description
  date: 2026-03-27
  author: Little100
  readMinutes: 4
  tags: ["post.assets-workflow.tag.工具","post.assets-workflow.tag.工作流"]
  icon: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80"
---

post.assets-workflow.p0
|{[(post.assets-workflow.annotation.body)]}||
|{[(post.assets-workflow.annotation.body)]}|post.assets-workflow.annotation.title|

## post.assets-workflow.section.端到端流程

```
raw-assets/images/     ← 放你的原始大图（不推送）
        ↓
  node scripts/compress-assets.mjs
        ↓
public/assets/images/  ← 压缩后 post.assets-workflow.table.cell12（推送到 GitHub）
```

post.assets-workflow.p1

```bash
npm run compress
```

post.assets-workflow.p2

post.assets-workflow.p3
post.assets-workflow.p4
post.assets-workflow.p5
post.assets-workflow.p6

| post.assets-workflow.table.cell7 | post.assets-workflow.table.cell8 | post.assets-workflow.table.cell9 | post.assets-workflow.table.cell10 |
| ------ | ------ | ---- | ---- |
| post.assets-workflow.table.cell11    | post.assets-workflow.table.cell12   | post.assets-workflow.table.cell13  | post.assets-workflow.table.cell14 |
| post.assets-workflow.table.cell15   | post.assets-workflow.table.cell12   | post.assets-workflow.table.cell16  | post.assets-workflow.table.cell17 |
| post.assets-workflow.table.cell12   | post.assets-workflow.table.cell12   | post.assets-workflow.table.cell18  | post.assets-workflow.table.cell19 |
| post.assets-workflow.table.cell20   | post.assets-workflow.table.cell12   | post.assets-workflow.table.cell18  | post.assets-workflow.table.cell21 |
| post.assets-workflow.table.cell22    | post.assets-workflow.table.cell12   | post.assets-workflow.table.cell18  | post.assets-workflow.table.cell23|

<circle-question>
post.assets-workflow.p24
</circle-question>

## post.assets-workflow.section.一次性准备

post.assets-workflow.p25

```bash
npm install sharp
mkdir raw-assets/images
```

post.assets-workflow.p26

## post.assets-workflow.section.为什么不一直用.unsplash.外链.

post.assets-workflow.p27

post.assets-workflow.p28
post.assets-workflow.p29
post.assets-workflow.p30

## post.assets-workflow.section.用.gitignore.排除原稿

post.assets-workflow.p31

```gitignore
raw-assets/
```

> post.assets-workflow.pullquote

