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

## 自动发布

推送到 `master` 分支后会自动运行单元测试。测试通过后：

- 部署文档到 `https://fy-store.github.io/uxiu/`
- 当前 `uxiu` 版本尚未发布时，构建并发布到 npm

其他分支和 Pull Request 不运行校验或发布流程。npm 使用 Trusted Publishing，无需保存长期访问令牌。
