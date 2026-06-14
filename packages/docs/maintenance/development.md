# 开发与发布

## 仓库结构

```text
packages/
  core/    uxiu npm 包
  docs/    VitePress 文档
```

## 环境

- Node.js 22+
- pnpm 10+

```bash
pnpm install
```

## 常用命令

```bash
# 快速启动文档站
pnpm dev

# 构建 core 和文档
pnpm build

# 单独开发或构建
pnpm dev:core
pnpm dev:docs
pnpm build:core
pnpm build:docs

# core 测试（监听模式）
pnpm test

# 一次性测试
pnpm test:run

# 类型检查
pnpm typecheck

# 完整检查
pnpm check
```

## 文档

```bash
pnpm dev
pnpm build:docs
pnpm preview
```

文档内容位于 `packages/docs`。导航配置位于 `.vitepress/config.mts`。

## 发布包

发布内容来自 `packages/core`：

```bash
pnpm --dir packages/core pack --dry-run
```

发布前检查：

1. `packages/core/package.json` 版本与 Git 标签一致
2. `pnpm check` 通过
3. npm 包清单只包含需要的构建产物、README、LICENSE 和 package.json
4. 四个公开入口均可加载

推送 `v*` 标签后，GitHub Actions 会校验标签版本、发布 npm 包并创建 GitHub Release。仓库需要配置 `NPM_TOKEN`。
