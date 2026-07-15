# 模块入口

uxiu 提供四个公开入口。建议使用最具体的入口，避免把当前运行环境不支持的模块引入产物。

| 入口 | 内容 | 运行环境 |
| --- | --- | --- |
| `uxiu` | 聚合所有公开 API | 取决于实际使用的工具 |
| `uxiu/utils` | 类型判断、对象工具、只读代理、DbFit | 所有 JavaScript 环境，无宿主环境 API 依赖 |
| `uxiu/dependence` | 随机数、计时任务、防抖、节流 | 依赖宿主环境 API |
| `uxiu/node` | Koa、日志、会话、请求检查、本地 IP | 仅 Node.js |

## 推荐导入方式

```ts
import { isString } from 'uxiu'
import { readonly, safe } from 'uxiu/utils'
import { debounce, everydayTask, random } from 'uxiu/dependence'
import { createApp, SessionStore } from 'uxiu/node'
```

## 宿主环境依赖

`uxiu/dependence` 不绑定某一种平台，但要求运行环境提供对应 API：

| 工具 | 所需 API |
| --- | --- |
| `random` | `globalThis.crypto.getRandomValues` |
| `sleep` | `setTimeout`、`Date` |
| `everydayTask` | `setTimeout`、`clearTimeout`、`Date`、Promise 微任务 |
| `debounce` | `setTimeout`、`clearTimeout` |
| `throttle` | `setTimeout`、`clearTimeout`、`Date.now` |

## 可选依赖

Node 模块采用动态导入，只有使用相应功能时才需要安装 peer 依赖。

| 功能 | 依赖 |
| --- | --- |
| `createApp` | `koa` + `pino` |
| `createLogger` | `pino` |
| `createRequestInspector` | `path-to-regexp` |
| Koa 路由集成 | `@koa/router` |

```bash
pnpm add koa
pnpm add pino
pnpm add path-to-regexp
```

::: warning 浏览器项目
不要从 `uxiu` 或 `uxiu/node` 导入。使用 `uxiu/utils`，或在确认宿主 API 可用后使用 `uxiu/dependence`。
:::

完整清单见 [API 总览](/api/)。
