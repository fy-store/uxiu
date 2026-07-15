---
layout: home

hero:
  name: uxiu
  text: Web 后端基础工具库
  tagline: 本文档由大模型辅助生成, 可能会与实际使用有细微差异, 实际使用请参考具体方法的文档注释
  image:
    src: /logo.svg
    alt: uxiu
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 浏览 API
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/fy-store/uxiu

features:
  - title: TypeScript 优先
    details: 提供类型守卫、泛型返回值和按配置推导的日志分类类型。
  - title: Koa 基础能力
    details: 集成应用生命周期、请求上下文、日志模块、路由规则检查和会话存储。
  - title: 可拆分导入
    details: 支持 uxiu、uxiu/utils、uxiu/dependence 和 uxiu/node 四个公开入口。
  - title: 可扩展只读代理
    details: 深浅只读、原始值恢复，以及 Date、集合和二进制数据插件。
---

## 安装

```bash
pnpm add uxiu
```

Node/Koa 模块按需安装 peer 依赖：

```bash
pnpm add koa @koa/router pino path-to-regexp
```

```ts
import { safe } from 'uxiu/utils'
import { random } from 'uxiu/dependence'

const [error, result] = await safe(async () => {
	return random(1000, 9999)
})
```
