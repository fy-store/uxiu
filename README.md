# uxiu

为 Koa 后端应用提供基础模块的工具包。

## 安装

```bash
pnpm add uxiu
```

## Monorepo 结构

```text
packages/
  core/    npm 包 uxiu
```

## 开发

需要 Node.js 22+ 和 pnpm 10+。

```bash
pnpm install
pnpm check
```

常用命令：

```bash
# 启动文档开发服务器
pnpm dev

# 构建 core 和文档
pnpm build

# 分包开发与构建
pnpm dev:core
pnpm dev:docs
pnpm build:core
pnpm build:docs

pnpm test
pnpm test:cov
pnpm typecheck
```

## 文档

文档站位于 `packages/docs`，使用 VitePress 构建。

```bash
pnpm dev
pnpm build:docs
pnpm preview
```
