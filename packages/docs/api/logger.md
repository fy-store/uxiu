# 日志模块

日志模块基于 `pino` 写入 newline-delimited JSON，每条日志占一行。`pino` 是可选 peer 依赖，仅在首次调用 `createLogger()` 或 createApp 启用日志时动态导入；没有使用日志功能时不会加载。

```bash
pnpm add pino
```

如果真正初始化日志时未安装 pino，会抛出包含安装命令的明确错误。

## 初始化与固定分类

```ts
import {
	createLogger,
	accessLogger,
	businessLogger,
	businessErrorLogger,
	systemErrorLogger,
	debugLogger
} from 'uxiu/node'

const logger = await createLogger({
	storageDirPath: './logs',
	base: { service: 'order-api' },
	fixedCategories: {
		access: true,
		business: true,
		businessError: true,
		systemError: true,
		debug: process.env.NODE_ENV === 'development'
	}
})

accessLogger.info({ method: 'GET', path: '/orders' }, 'request completed')
businessLogger.info({ orderId: 42 }, 'order created')
businessErrorLogger.error(new Error('invalid order'), 'business failed')
systemErrorLogger.error(new Error('invariant broken'), 'unexpected system state')
debugLogger.debug({ orderId: 42 }, 'debug payload')
```

五个固定分类在进程内都是稳定单例。既可通过 `logger.access` 等属性访问，也可以直接导入对应的 `*Logger`，因此定时任务、消息消费者、数据库模块等路由外代码可以共享相同分类。

| 分类 | 用途 | 默认状态 | 默认级别 | 输出 |
| --- | --- | --- | --- | --- |
| `access` | HTTP 访问记录 | 开启 | info | `logs/access/access-<日期>.log` |
| `business` | 正常业务事件 | 开启 | info | `logs/business/business-<日期>.log` |
| `businessError` | 可预期、可恢复的业务错误 | 开启 | error | `logs/businessError/businessError-<日期>.log` |
| `systemError` | 程序崩溃或不应出现的系统错误 | 开启 | error | `logs/systemError/systemError-<日期>.log` |
| `debug` | 调试信息 | 开启 | debug | `logs/debug/debug-<日期>.log` |

除系统崩溃处理器会在 `uncaughtException` / `unhandledRejection` 时自动写入 `systemError` 外，日志模块不会主动写入任何分类。启用分类只表示它可以被调用；访问、业务、业务错误和 debug 日志的消息及字段完全由应用提供。createApp 同样只初始化和挂载分类，不会自动生成访问或业务错误记录。

关闭的固定分类在调用时会抛出“分类未启用”错误，避免日志静默丢失。也可以用 `logger.hasCategory(name)` 先判断。

## 快速创建和收集分类

运行时创建新分类需要等待目标文件 ready，保证函数返回后即使进程立刻退出也能同步刷新：

```ts
const audit = await logger.createCategory('audit', {
	level: 'debug',
	bindings: { domain: 'security' }
})

audit.warn({ userId: 7 }, 'role changed')
logger.category('audit').info('reuse existing category')
```

也可以在初始化时预创建：

```ts
await createLogger({
	storageDirPath: './logs',
	categories: {
		audit: { level: 'debug' },
		payment: true,
		disabled: false
	}
})
```

所有固定和自定义分类都会收集到 `logger.categories` 的只读 Map 快照中，并纳入统一刷新和关闭流程。固定分类只能通过 `fixedCategories` 配置；分类名只允许字母、数字、下划线和连字符。

## 文件轮转

日志默认按天切分文件，并且单个文件超过 5MB 时继续按序号拆分，不需要额外配置：

```text
logs/business/business-2026-09-18.log
logs/business/business-2026-09-18.1.log
logs/business/business-2026-09-18.2.log
```

通过 `rotation` 可以调整时间周期、大小上限，或整体关闭轮转：

```ts
await createLogger({
	storageDirPath: './logs',
	rotation: {
		// 按小时切分：<category>-YYYY-MM-DD-HH.log
		interval: 'hourly',
		// 单个文件上限 20MB
		maxFileSize: 20 * 1024 * 1024
	}
})
```

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `rotation.enabled` | `true` | 设为 `false` 时关闭轮转，退回单个 `<category>.log` |
| `rotation.interval` | `'daily'` | `'daily'` / `'hourly'`；设为 `false` 时只按大小轮转 |
| `rotation.maxFileSize` | `5242880`（5MB） | 单个文件大小上限（字节）；设为 `false` 时只按时间轮转 |

单条日志本身超过上限时仍会完整写入，避免因无法分割单条记录而反复轮转。进程重启后会继续追加当前时间片段下序号最大的文件，不会重复创建碎片文件。轮转只负责拆分文件，不负责删除历史文件，归档和清理策略需要由部署侧或外部日志采集系统处理。

## 元信息与 `_meta_`

框架为每条日志产生的元信息统一收敛到 `_meta_` 字段，业务字段始终保留在 JSON 顶层，因此不会出现框架字段覆盖业务同名字段的情况：

```json
{
	"orderId": 42,
	"msg": "order created",
	"_meta_": {
		"pid": 12345,
		"hostname": "app-1",
		"category": "business",
		"level": 30,
		"caller": { "file": "/app/src/order.ts", "line": 12, "column": 8, "function": "createOrder" },
		"stack": []
	}
}
```

| `_meta_` 字段 | 来源 | 说明 |
| --- | --- | --- |
| `pid`、`hostname` | `base` | `base` 默认值；传入对象时使用该对象，传入 `null` 时不写入 |
| `category` | 分类名 | 由日志模块管理，不需要也不应该在 `bindings` 中重复配置 |
| `level` | 日志级别 | pino 的数值级别，例如 `info` 为 `30` |
| `caller` | 调用位置 | 直接调用日志方法的文件、行、列和函数名 |
| `stack` | 调用堆栈 | 过滤 logger、pino 和 Node.js 内部帧后的结构化调用堆栈 |

`base` 只影响 `_meta_`，不再写入 JSON 顶层。`level` 也不再出现在顶层，只在 `_meta_.level` 中保留数值级别。

## 扩展字段

业务字段会合并到最终 JSON 顶层，pino 的 `child()` 可固定请求或任务上下文：

```ts
const requestLogger = businessLogger.child({
	requestId: 'req-1',
	userId: 7
})

requestLogger.info({ orderId: 42 }, 'order created')
```

`child()` 传入的固定字段同样写入 JSON 顶层，适合放置 requestId、userId 等请求或任务级上下文。分类级固定字段则通过分类的 `bindings` 配置，效果相同。

通过 `pinoOptions` 可以配置脱敏、序列化器和自定义字段格式：

```ts
await createLogger({
	storageDirPath: './logs',
	pinoOptions: {
		redact: ['password', 'token']
	}
})
```

`name`、`level`、`base`、`timestamp` 以及 `formatters.level` 由日志模块管理，不能在 `pinoOptions` 中设置。

## 自定义记录内容

`record` 钩子在每条日志写入前调用，可以增删顶层业务字段、`_meta_` 元字段或消息。钩子接收当前分类、级别、消息和已整理的字段，返回的对象只覆盖显式返回的字段：

```ts
await createLogger({
	storageDirPath: './logs',
	record({ category, level, data, meta, message }) {
		return {
			// 顶层业务字段：补充环境标识
			data: { ...data, env: process.env.NODE_ENV },
			// 元字段：补充 traceId，或覆盖分类/级别
			meta: { ...meta, traceId: currentTraceId() },
			// 消息：返回 undefined 时不写入 msg 字段
			message: message ? `[${category}] ${message}` : message
		}
	}
})
```

| 上下文/返回字段 | 说明 |
| --- | --- |
| `category`、`level` | 只读的分类名和数值级别 |
| `message` | 调用日志方法时提供的消息；未提供时为 `undefined` |
| `data` | 将被写到 JSON 顶层的业务字段 |
| `meta` | 将被写入 `_meta_` 的元字段 |
| 返回 `data` / `meta` / `message` | 覆盖对应内容；未返回的字段保持默认值 |

钩子必须同步返回且不应抛错。返回 `{ message: undefined }` 可以移除消息字段。

## 调用位置和堆栈

每条日志默认在 `_meta_` 中增加：

- `caller`：直接调用日志方法的文件、行、列和函数名；
- `stack`：过滤 logger、pino 和 Node.js 内部帧后的结构化调用堆栈，默认最多 10 层。

使用 `stackTraceLimit` 调整层数，或通过 `captureStack: false` 关闭采集以降低高吞吐场景的开销。

## 刷新和关闭：具体什么时候调用

| 方法 | 谁调用 | 调用时机 | 是否阻塞事件循环 | 调用后能否继续写日志 |
| --- | --- | --- | --- | --- |
| `await logger.flush()` | 业务代码或测试按需调用 | 进程继续运行，但下一步必须确认当前日志已经落盘 | 否 | 可以 |
| `logger.flushSync()` | 通常由日志模块内部调用 | 已经不能等待 Promise 的同步退出或崩溃阶段 | 是 | 技术上可以，但不应用于正常流程 |
| `await logger.close()` | 应用的优雅退出流程调用 | 应用最终停止、测试结束或需要重新初始化日志之前 | 否 | 不可以，必须重新初始化 |

### `flush()`：程序继续运行，但必须先落盘

适合以下情况：

- 测试马上要读取日志文件并断言内容；
- 审计日志落盘后，才能向消息队列或外部系统确认成功；
- 日志文件即将由应用自行轮转、归档或读取。

```ts
businessLogger.info({ jobId: 42 }, 'job completed')
await logger.flush()

// 此时前面的日志已经写入文件，logger 仍可继续使用。
businessLogger.info({ jobId: 43 }, 'next job started')
```

不要在每个 HTTP 请求、每条业务日志之后调用 `flush()`。这会频繁等待磁盘，抵消 pino 异步缓冲的吞吐优势。应用最终退出时也不应只调用 flush，因为它不会关闭文件和移除监听器。

### `flushSync()`：只能同步退出时使用

正常业务代码通常不需要调用。日志模块已经在以下内部流程自动调用：

- 正常 Node.js `exit`；
- 模块捕获到 `uncaughtException`；
- 模块捕获到 `unhandledRejection`。

只有关闭内置崩溃处理器并自行实现同步崩溃处理时，才需要手动调用：

```ts
await createLogger({
	storageDirPath: './logs',
	registerFatalHandler: false
})

process.once('uncaughtException', (error) => {
	systemErrorLogger.fatal({ err: error }, 'uncaught exception')
	logger.flushSync()
	process.exit(1)
})
```

`flushSync()` 会阻塞事件循环，只刷新文件，不关闭文件，也不移除监听器。不要在请求处理中、定时任务中或普通 SIGTERM 优雅退出中使用。

### `close()`：应用最终停止时使用

`close()` 会依次完成：

1. 等待尚在创建的自定义分类 ready；
2. 异步刷新所有分类；
3. 关闭所有日志文件；
4. 移除模块注册的崩溃处理器；
5. 重置进程级日志单例，使其可以重新初始化。

收到 SIGTERM/SIGINT 时，应先停止接收新请求或任务，再关闭日志：

```ts
process.once('SIGTERM', () => {
	application.server.close(async (error) => {
		if (error) process.exitCode = 1

		await application.logger?.close()
		process.exit(process.exitCode ?? 0)
	})
})
```

测试中如果每个用例重新初始化日志，应在清理文件之前关闭：

```ts
import fs from 'node:fs/promises'

afterEach(async () => {
	await logger.close()
	await fs.rm(logsPath, { recursive: true, force: true })
})
```

`close()` 完成后不能继续使用 `businessLogger` 等分类实例；需要再次调用 `createLogger()`。重复调用 close 是安全的。

## 自动退出和崩溃行为

`createLogger()` 会等待所有初始分类的目标文件 ready 后才返回。`registerFatalHandler` 默认为 `true`：

- 普通返回、事件循环自然结束或调用 `process.exit()`：`exit` 处理器只同步刷新已有日志，不生成新的日志；
- `uncaughtException`：先写入 `systemError`，同步刷新全部分类，再以状态码 1 退出；
- `unhandledRejection`：先写入 `systemError`，同步刷新全部分类，再以状态码 1 退出；
- 显式关闭 `systemError`：不会注册上述两个崩溃处理器；
- 应用自行监听 SIGTERM/SIGINT：模块不会抢占信号处理，应由应用调用 `await logger.close()`。

SIGKILL、操作系统强制终止、断电等场景不会执行任何 JavaScript，任何日志库都无法保证刷新；需要依赖操作系统、容器运行时或外部日志采集系统。
