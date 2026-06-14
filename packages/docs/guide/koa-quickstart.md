# Koa 应用示例

下面的示例组合 `createApp`、日志、请求检查器和会话存储。

## 安装依赖

```bash
pnpm add uxiu koa log4js path-to-regexp
```

## 创建应用

```ts
import {
	createApp,
	createRequestInspector,
	SessionStore
} from 'uxiu/node'

const inspector = await createRequestInspector()
const publicRules = inspector.create(
	[
		{ methods: 'GET', path: '/health' },
		{ methods: ['GET', 'POST'], path: '/session/*' }
	],
	{ base: '/api' }
)

type Session = {
	userId: number
	name: string
}

const sessions = new SessionStore().create<Session>()

const application = await createApp({
	port: 3000,
	env: 'development',
	loggerOptions: {
		storageDirPath: './logs',
		crashAutoRegister: false,
		expandCategories: {
			access: true
		}
	},
	inited({ app, logger }) {
		app.use(async (ctx, next) => {
			logger?.access.info(ctx.method, ctx.path, ctx.requestId)

			if (!inspector.check(publicRules, ctx.method as any, ctx.path)) {
				ctx.status = 403
				return
			}

			await next()
		})

		app.use(async (ctx) => {
			if (ctx.path === '/api/health') {
				ctx.body = { ok: true }
				return
			}

			if (ctx.method === 'POST') {
				const id = await sessions.create({
					userId: 1,
					name: 'admin'
				})
				ctx.body = { id }
			}
		})
	},
	mounted({ port }) {
		console.log(`http://localhost:${port}`)
	}
})

process.once('SIGTERM', () => {
	application.server.close()
})
```

## 请求上下文扩展

`createApp` 会在每次请求中写入：

| 字段 | 说明 |
| --- | --- |
| `ctx.requestId` | `crypto.randomUUID()` 与时间戳组成的请求 ID |
| `ctx.pwd` | 进程当前工作目录 |
| `ctx.bus` | 请求级 `event-imt` 事件总线 |
| `ctx.logger` | 配置日志模块后可用 |

请求总线支持 `success`、`error`、`end` 以及对应的 `hook:*` 事件。参见 [createApp API](/api/create-app)。
