# createApp

`createApp` 创建并监听一个 Koa 应用，同时组织初始化生命周期、请求上下文和可选日志。

```ts
import { createApp } from 'uxiu/node'
```

需要安装：

```bash
pnpm add koa
```

配置日志时还需安装 `log4js`。

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
		ctx.logger?.app.info(ctx.requestId)
	})

	await next()
})
```

事件：

- `success` / `hook:success`
- `error` / `hook:error`
- `end` / `hook:end`

请求中抛出的异常由基础中间件捕获并发送到请求事件总线。业务需要按自身策略设置响应状态和内容。
