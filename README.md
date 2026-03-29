# Blog

一个基于 React + Vite 构建的个人博客，支持 Markdown 写作与多语言。

> 几乎所有代码均由llm生成

## 快速开始

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

输出目录：`dist/`

---

## 部署到 GitHub Pages

### 重要安全说明

由于本项目是**纯静态站点**（部署到 GitHub Pages），所有代码最终都会公开暴露在浏览器中。了解以下安全边界至关重要：

| 类型 | 示例 | 安全性 |
|------|------|--------|
| **必须公开** | Giscus 配置、SEO 设置、社交链接 | 这些值必须公开，Giscus 需要公开仓库 |
| **构建时内联** | `.env` 中的 `VITE_*` 变量 | **构建后即公开**，等同于写在代码里 |
| **无法使用** | API 密钥、私人 Token | 纯静态站点无法保护任何客户端密钥 |

> **核心原则**：不要将任何需要保密的值放入静态站点的配置中。如果需要私有数据，必须使用后端服务。

### 自动部署（推荐）

1. **Fork 本仓库**，或将其推送到你的 GitHub 仓库

2. **配置 GitHub Pages**：
   - 进入仓库 → **Settings** → **Pages**
   - **Source** 选择 **GitHub Actions**

3. **首次推送**：
   ```bash
   git add .
   git commit -m "feat: initial commit"
   git push origin main
   ```
   GitHub Actions 会自动构建并部署。

4. **访问你的博客**：
   - 博客地址：`https://你的用户名.github.io/仓库名/`
   - 或如果你使用自定义域名，在 DNS 设置中配置即可。

### 本地构建预览

```bash
# 构建生产版本
npm run build

# 预览构建结果（模拟 GitHub Pages 环境）
npm run preview
```

### 自定义域名（可选）

如果你使用自定义域名：

1. 在 `public/` 目录下添加 `CNAME` 文件（无扩展名），内容为你的域名：
   ```
   blog.example.com
   ```

2. 在你的域名 DNS 设置中添加 CNAME 记录指向 `你的用户名.github.io`

---

## 配置

### config.json

所有站点配置集中在根目录的 `config.json` 文件中：

```json
{
  "title": "你的博客标题",
  "avatar": "/avatar.png",
  "defaultAuthor": "作者名",
  "seo": {
    "siteUrl": "https://你的域名.com",
    "description": { "zh": "描述", "en": "Description" }
  },
  "social": [ ... ],
  "giscus": { ... }
}
```

> **注意**：这些配置会直接打包进最终的 JS/CSS 文件中，因此**不要**在此文件中放置任何私密信息。

### 关于 .env 文件

项目根目录包含 `.env.example` 作为环境变量的示例参考。但由于静态站点的特性：

- **Vite 环境变量**（`VITE_*` 前缀）在构建时被内联到代码中
- 构建后的文件会直接包含这些值，任何人都可以在浏览器中查看
- **本项目当前不使用运行时环境变量**，所有配置通过 `config.json` 管理

```bash
# .env.example 仅作为参考，不要用于私密数据
VITE_GISCUS_REPO=your-username/your-repo
VITE_GISCUS_REPO_ID=R_xxxxxxxxxxxxxx
```

### Giscus 评论系统

> Giscus 配置本身需要公开，因为它依赖 GitHub Discussions API 正常工作。

#### 1. 启用 Giscus App

1. 访问 [giscus.app](https://giscus.app)
2. 点击 "Authorize" 授权 GitHub App 到你的仓库
3. 选择允许评论的仓库

#### 2. 获取配置值

在 [giscus.app](https://giscus.app) 填写：

- **Repository**: `username/blog`
- **Page ↔️ Discussions Mapping**: `pathname`
- **Discussion Category**: 选择一个分类（如 "Announcements"）

#### 3. 填入 config.json

将获取到的值填入 `config.json` 的 `giscus` 字段：

```json
{
  "giscus": {
    "enabled": true,
    "repo": "your-username/your-repo",
    "repoId": "R_xxxxxxxxxxxxxx",
    "category": "Announcements",
    "categoryId": "DIC_xxxxxxxxxxxxxx",
    "mapping": "pathname",
    "reactionsEnabled": "1",
    "emitMetadata": "0",
    "inputPosition": "bottom",
    "lang": "zh-CN"
  }
}
```

---

## 图片压缩

项目使用 Sharp 进行自动化图片压缩，支持 PNG/JPEG/WebP/AVIF/GIF 输入，输出为 WebP 格式。

### 工作流

```
raw-assets/images/    (原始大图，仅本地)
        ↓
   自动压缩 (开发时实时 / 构建时手动)
        ↓
public/assets/images/  (压缩后 WebP，提交到 GitHub)
```

### 开发模式（推荐）

**完全自动** — 无需手动运行压缩脚本：

```bash
npm run dev
```

当你向 `raw-assets/images/` 添加或修改图片时，Vite 插件会自动：
1. 检测文件变化
2. 转换为 WebP（增量压缩，只处理有变更的文件）
3. 输出到 `public/assets/images/`

直接在文章中引用压缩后的路径：

```markdown
![我的照片](/assets/images/my-photo.webp)
```

### 手动压缩

如需在非开发模式（CI 或生产构建）下压缩：

```bash
npm run compress
```

这会扫描 `raw-assets/images/`，将所有图片压缩并输出到 `public/assets/images/`。

### 质量预设

| 源格式 | 输出 | 质量 |
|--------|------|------|
| PNG | 无损 WebP | quality 90 |
| JPEG | 有损 WebP | 82% |
| WebP/AVIF | WebP | 85% |
| GIF | WebP | 动画不保留 |

### Git 排除

- ✅ `raw-assets/` 已在 `.gitignore` 中排除
- ✅ 只有压缩后的 WebP 会进入仓库
- ✅ 原始大图保存在本地，不占用 GitHub 空间

### 目录结构

```
blog/
├── raw-assets/
│   └── images/           ← 放入原始图片（不在 Git 中）
│       ├── photo.jpg
│       └── screenshot.png
└── public/
    └── assets/
        └── images/       ← 压缩后的 WebP（提交到 Git）
            ├── photo.webp
            └── screenshot.webp
```

---

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（自动压缩图片） |
| `npm run build` | 构建生产版本（含同步文章和生成 sitemap） |
| `npm run build:fast` | 快速构建（跳过文章同步） |
| `npm run preview` | 预览构建结果 |
| `npm run compress` | 手动压缩 `raw-assets/images/` 中的所有图片 |
| `npm run generate` | 仅运行生成脚本（同步文章 + sitemap） |
| `npm run generate:sitemap` | 仅生成 sitemap |

---

## 写作

### 添加新文章

1. 在 `public/content/source/posts/` 目录下创建 Markdown 文件
2. 在 `src/i18n/content/posts/` 下创建对应的翻译文件（可选）
3. 运行 `npm run generate` 同步文章索引
4. 提交更改，GitHub Actions 会自动部署
