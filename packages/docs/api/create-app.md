# createApp

`createApp` 创建并监听一个 Koa 应用，同时组织初始化生命周期、请求上下文和可选日志。

```ts
import { createApp } from 'uxiu/node'
```

需要安装：

```bash
pnpm add koa
```

配置日志时还需安装 `pino`。pino 只在配置了 `loggerOptions` 后动态导入。createApp 只负责初始化并挂载日志单例，不会自动写入访问、业务或业务错误日志。

## 基础示例

```ts
const application = await createApp({
	port: 3000,
	env: 'development',
	koaOptions: {
		proxy: true,
		keys: ['cookie-secret']
	},
	inited({ app }) {
		app.use((ctx) => {
			ctx.body = { requestId: ctx.requestId }
		})
	}
})
```

返回上下文包含：

```ts
{
	port: number
	env: 'production' | 'development'
	koaOptions: CreateAppKoaOptions
	app: Koa
	server: http.Server
	logger?: Logger
}
```

## 生命周期

执行顺序：

1. `beforeInit`
2. 创建日志实例（如果配置）
3. 创建 Koa 实例并注册基础中间件
4. `inited`
5. 创建 HTTP Server
6. `beforeMount`
7. 监听端口
8. `mounted`

所有生命周期都可以返回 Promise。

```ts
await createApp({
	beforeInit(ctx) {},
	inited(ctx) {},
	beforeMount(ctx) {},
	mounted(ctx) {}
})
```

传入生命周期的上下文是浅层只读对象，不能替换 `port`、`app` 等顶层字段。

## 配置

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `port` | `3323` | 监听端口，传 `0` 可让系统选择端口 |
| `env` | `production` | 仅支持 `production` / `development` |
| `koaOptions` | `{}` | Koa 的 keys、proxy、subdomain 等配置 |
| `loggerOptions` | 未启用 | 日志配置 |
| `mountPortErrorTip` | `true` | 端口占用时是否输出提示 |
| `onMountError` | 未设置 | 监听失败回调 |

## 请求上下文和事件

基础中间件为每个请求增加 `requestId`、`pwd`、`bus` 和可选 `logger`。

```ts
app.use(async (ctx, next) => {
	ctx.bus.on('hook:end', async () => {
		ctx.logger?.business.info({ requestId: ctx.requestId }, 'request hooks completed')
	})

	await next()
})
```

事件：

- `success` / `hook:success`
- `error` / `hook:error`
- `end` / `hook:end`

`loggerOptions.fixedCategories` 可以分别开启或关闭 `access`、`business`、`businessError`、`systemError` 和 `debug`。开启分类只代表分类可以使用，不代表 createApp 会主动写入。

请求中抛出的异常已经通过 `error` / `hook:error` 事件发送；成功和请求结束分别通过 `success` / `hook:success`、`end` / `hook:end` 发送。createApp 不会额外写入 `businessError` 或 `access`，应用可以在事件订阅器中决定记录内容和字段：

```ts
app.use(async (ctx, next) => {
	ctx.bus.on('end', () => {
		ctx.logger?.access.info(
			{ requestId: ctx.requestId, method: ctx.method, path: ctx.path, status: ctx.status },
			'request completed'
		)
	})

	ctx.bus.on('error', (error) => {
		ctx.logger?.businessError.error(
			{ err: error, requestId: ctx.requestId, path: ctx.path },
			'request failed'
		)
	})

	await next()
})
```

固定分类是进程级单例。createApp 初始化完成后，路由外模块可以直接导入使用：

```ts
import { businessLogger } from 'uxiu/node'

businessLogger.info({ task: 'daily-report' }, 'background task started')
```
