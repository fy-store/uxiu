# 日志模块

`createLogger` 基于 `log4js` 创建文件日志和控制台日志。

```bash
pnpm add log4js
```

## 创建日志

```ts
import { createLogger } from 'uxiu/node'

const logger = await createLogger({
	storageDirPath: './logs',
	crashAutoRegister: false
})

logger.app.info('application started')
logger.debug.debug('debug payload')
logger.crash.error('critical error')
logger.console.info('stdout message')
```

默认分类：

| 属性 | 默认级别 | 输出 |
| --- | --- | --- |
| `app` | info | `logs/app/app.log` |
| `debug` | debug | `logs/debug/debug.log` |
| `crash` | error | `logs/crash/crash.log` |
| `console` | all | 控制台 |

## 扩展分类

`expandCategories` 的字面量配置会生成对应的 TypeScript 属性。

```ts
const logger = await createLogger({
	storageDirPath: './logs',
	expandCategories: {
		access: true,
		audit: true,
		disabled: false
	}
})

logger.access.info('GET /api/users')
logger.audit.warn('role changed')
// logger.disabled 不会生成
```

不能使用 `logger` 作为扩展分类名。

## 崩溃日志

`crashAutoRegister` 默认为 `true`。启用后会注册 `uncaughtException` 监听器，写入崩溃日志、关闭 log4js，并以状态码 1 退出。

测试、嵌入式运行或已有全局异常策略的应用应显式关闭：

```ts
await createLogger({
	storageDirPath: './logs',
	crashAutoRegister: false
})
```

## 自定义 log4js

通过 `log4jsConfiguration` 覆盖或增加 appenders 和 categories。uxiu 内置分类会合并到配置中。

```ts
await createLogger({
	storageDirPath: './logs',
	log4jsConfiguration: {
		pm2: true,
		appenders: {},
		categories: {}
	}
})
```
