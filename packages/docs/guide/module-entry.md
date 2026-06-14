# 模块入口

uxiu 提供四个公开入口。建议使用最具体的入口，便于表达运行环境和依赖边界。

| 入口 | 内容 | 运行环境 |
| --- | --- | --- |
| `uxiu` | 所有公开 API | Node.js 为主 |
| `uxiu/utils` | 类型判断、对象工具、只读代理、DbFit | js 环境, 无宿主环境依赖 |
| `uxiu/dependence` | `random`、`sleep`、`everydayTask` | Node.js / 浏览器 |
| `uxiu/node` | Koa、日志、会话、请求检查、本地 IP | Node.js |

## 推荐导入方式

```ts
import { isString } from 'uxiu'
import { readonly, safe } from 'uxiu/utils'
import { everydayTask, random } from 'uxiu/dependence'
import { createApp, SessionStore } from 'uxiu/node'
```

## 可选依赖

Node 模块采用动态导入，只有使用相应功能时才需要安装 peer 依赖。

| 功能 | 依赖 |
| --- | --- |
| `createApp` | `koa` + `log4js` |
| `createLogger` | `log4js` |
| `createRequestInspector` | `path-to-regexp` |
| Koa 路由集成 | `@koa/router` |

```bash
pnpm add koa
pnpm add log4js
pnpm add path-to-regexp
```

::: warning 浏览器项目
不要从 `uxiu` 或 `uxiu/node` 导入浏览器代码。使用 `uxiu/utils` 和 `uxiu/dependence`，并确认所用 API 不依赖 Node 全局对象。
:::
