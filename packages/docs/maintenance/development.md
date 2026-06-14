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

## 自动发布

只有推送到 `master` 分支时才会运行 GitHub Actions。其他分支和 Pull Request 不执行测试、构建或发布。

`master` 流程：

1. 安装冻结锁文件依赖
2. 运行 core 单元测试
3. 测试通过后构建并部署文档到 GitHub Pages
4. 构建 core，并在 npm 中不存在当前版本时发布 `uxiu`

发布 npm 新版本前，需要更新 `packages/core/package.json` 中的 `version`。已存在的版本会跳过 npm 发布，但文档仍会正常部署。

仓库设置要求：

- GitHub Pages 的 Source 选择 `GitHub Actions`
- Actions 的 Workflow permissions 允许读取仓库内容
- 在 npm 的 `uxiu` 包设置中添加 GitHub Actions Trusted Publisher：
  - Organization or user：`fy-store`
  - Repository：`uxiu`
  - Workflow filename：`publish.yml`
  - Allowed actions：`npm publish`
