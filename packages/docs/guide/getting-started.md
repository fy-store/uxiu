# 快速开始

## 环境要求

- Node.js 22 或更高版本
- ESM 项目
- 推荐使用 TypeScript

## 安装

::: code-group

```bash [pnpm]
pnpm add uxiu
```

```bash [npm]
npm install uxiu
```

```bash [yarn]
yarn add uxiu
```

:::

## 第一个示例

通用工具可以从 `uxiu/utils` 导入：

```ts
import { extract, isEffectiveNumber, safe } from 'uxiu/utils'

const payload = { id: 1, name: 'uxiu', internal: true }
const publicData = extract(payload, ['id', 'name'])

if (isEffectiveNumber(publicData.id)) {
	console.log(publicData)
}

const [error, value] = safe(() => JSON.parse('{"ok":true}'))
if (error) {
	console.error(error)
} else {
	console.log(value.ok)
}
```

## 使用 Node 模块

`createApp`、日志、会话存储和请求检查器位于 `uxiu/node`。相关第三方库是可选 peer 依赖，请按实际功能安装：

```bash
pnpm add koa log4js path-to-regexp
```

```ts
import { createApp } from 'uxiu/node'

const { app, server } = await createApp({
	port: 3000,
	inited({ app }) {
		app.use((ctx) => {
			ctx.body = {
				requestId: ctx.requestId,
				message: 'Hello uxiu'
			}
		})
	}
})

console.log('listening', server.address())
```

## 下一步

- 了解不同运行环境应使用的[模块入口](/guide/module-entry)
- 查看完整的[Koa 应用示例](/guide/koa-quickstart)
- 从 [API 总览](/api/) 查看全部工具方法
