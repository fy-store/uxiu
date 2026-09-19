import type {
	Bindings,
	LevelWithSilentOrString,
	Logger as PinoLogger,
	LoggerOptions as PinoLoggerOptions
} from 'pino'

/**
 * 单个日志分类使用的 pino logger。
 *
 * @remarks
 * 支持 pino 的 `trace`、`debug`、`info`、`warn`、`error`、`fatal` 等级方法，
 * 也可以通过 pino 的 `child()` 为一组日志绑定 requestId、userId 等上下文字段。
 * 日志方法的对象参数会展开到最终的单行 JSON 顶层；框架产生的元信息统一收敛到
 * `_meta_` 字段，不会与业务字段同名冲突。
 *
 * @example
 * ```ts
 * logger.business.info({ orderId: 42 }, 'order created')
 * // { "orderId": 42, "msg": "order created", "_meta_": { "level": 30, "category": "business", ... } }
 * const requestLogger = logger.access.child({ requestId: 'req-1' })
 * requestLogger.info({ path: '/health' }, 'request completed')
 * ```
 */
export type CategoryLogger = PinoLogger

/**
 * 自定义日志记录内容时的上下文。
 *
 * @remarks
 * `data` 是写到 JSON 顶层的业务字段，`meta` 是将写入 `_meta_` 的框架元信息。
 */
export interface LoggerRecordContext {
	/** 日志分类名。 */
	category: string
	/** 日志级别数值。 */
	level: number
	/** 日志消息；调用日志方法时未提供消息则为 `undefined`。 */
	message?: unknown
	/** 将被写到 JSON 顶层的业务字段。 */
	data: Record<string, unknown>
	/** 将被写入 `_meta_` 的元字段。 */
	meta: Record<string, unknown>
}

/**
 * 记录钩子的返回值，只覆盖显式返回的字段。
 *
 * @remarks
 * 返回 `{ message: undefined }` 可以移除消息字段；未返回的字段保持默认内容。
 */
export interface LoggerRecordOverride {
	/** 覆盖顶层业务字段。 */
	data?: Record<string, unknown>
	/** 覆盖 `_meta_` 元字段。 */
	meta?: Record<string, unknown>
	/** 覆盖日志消息；返回 `undefined` 时不写入消息字段。 */
	message?: unknown
}

/**
 * 自定义每条日志记录内容的钩子。
 *
 * @remarks
 * 钩子在日志序列化后、写入文件前调用，可以增删业务字段、元字段或消息。
 * 不返回内容时保留默认记录内容。钩子必须同步返回，且不应抛错。
 */
export type LoggerRecordHook = (context: LoggerRecordContext) => LoggerRecordOverride | void

/**
 * 框架内置的五个固定日志分类。
 *
 * @remarks
 * 固定分类在进程内各自只有一个稳定的导出实例。日志模块初始化后，既可以通过 Logger 访问，
 * 也可以直接导入对应的 `accessLogger`、`businessLogger` 等实例在路由外使用。
 */
export type FixedLoggerCategoryName =
	| 'access'
	| 'business'
	| 'businessError'
	| 'systemError'
	| 'debug'

/**
 * V8 调用堆栈中的一个结构化位置。
 *
 * @remarks
 * 本模块自身、pino 内部和 `node:` 内置模块的堆栈帧会被过滤。
 * 文件 URL 会尽可能转换为当前操作系统使用的文件路径。
 */
export interface LoggerCallSite {
	/** 调用所在文件路径。通常为规范化后的绝对路径。 */
	file: string
	/** 调用所在行号，从 1 开始。 */
	line: number
	/** 调用所在列号，从 1 开始。 */
	column: number
	/** V8 能够识别时记录的函数名；匿名调用可能没有该字段。 */
	function?: string
}

/**
 * 单个日志分类的配置。
 *
 * @remarks
 * 配置只在分类首次创建时生效。对已经存在的分类再次调用 `createCategory()` 会返回原实例，
 * 不会修改其级别、启用状态或固定字段。
 */
export interface LoggerCategoryOptions {
	/**
	 * 分类允许写入的最低日志级别。
	 *
	 * @defaultValue 继承 {@link LoggerOptions.level}，最终默认为 `info`。
	 */
	level?: LevelWithSilentOrString
	/**
	 * 固定写入该分类每条日志的字段。
	 *
	 * @remarks
	 * 这些字段作为 pino child bindings 写到 JSON 顶层（不会进入 `_meta_`），
	 * 适合放置 domain、module、component 等分类级上下文。分类名由模块管理，
	 * 写入 `_meta_.category`，不需要也不应该在此重复配置。
	 */
	bindings?: Bindings
	/**
	 * 是否启用该分类。设为 `false` 时仍会创建分类实例和目标文件，但日志级别为 `silent`。
	 *
	 * @defaultValue `true`
	 */
	enabled?: boolean
}

/** 固定日志分类的启用状态和分类级配置。 */
export type FixedLoggerCategoriesOptions = Partial<
	Record<FixedLoggerCategoryName, boolean | LoggerCategoryOptions>
>

/** 日志文件按时间切分的周期。 */
export type LoggerRotationInterval = 'hourly' | 'daily'

/**
 * 日志文件轮转配置。
 *
 * @remarks
 * 默认按天切分文件，并且单个文件超过 5MB 时继续拆分为 `<category>-<日期>.<序号>.log`。
 * 时间片段和大小上限都可以单独关闭，也可以整体关闭轮转退回单文件模式。
 */
export interface LoggerRotationOptions {
	/**
	 * 是否启用文件轮转。
	 *
	 * @defaultValue `true`
	 */
	enabled?: boolean
	/**
	 * 按时间切分文件的周期。
	 *
	 * @remarks
	 * `'daily'` 生成 `<category>-YYYY-MM-DD.log`，`'hourly'` 生成 `<category>-YYYY-MM-DD-HH.log`。
	 * 设为 `false` 时不按时间切分，只按大小轮转。
	 *
	 * @defaultValue `'daily'`
	 */
	interval?: LoggerRotationInterval | false
	/**
	 * 单个日志文件的大小上限（字节）。
	 *
	 * @remarks
	 * 达到上限后写入带递增序号的同名文件，例如 `<category>-YYYY-MM-DD.1.log`。
	 * 单条日志本身超过上限时仍会完整写入。设为 `false` 时不按大小轮转。
	 *
	 * @defaultValue `5242880`（5MB）
	 */
	maxFileSize?: number | false
}

/**
 * {@link createLogger} 的初始化配置。
 *
 * @example
 * ```ts
 * const logger = await createLogger({
 *   storageDirPath: './logs',
 *   level: 'info',
 *   base: { service: 'order-api' },
 *   categories: {
 *     audit: { level: 'debug', bindings: { domain: 'security' } },
 *     payment: true
 *   },
 *   pinoOptions: {
 *     redact: ['password', 'token']
 *   }
 * })
 * ```
 */
export interface LoggerOptions {
	/**
	 * 日志存储根目录。
	 *
	 * @remarks
	 * 相对路径以 `process.cwd()` 为基准。目录会按需递归创建，每个分类写入
	 * `<storageDirPath>/<category>/<category>-<日期>.log`；关闭轮转时写入
	 * `<storageDirPath>/<category>/<category>.log`。
	 */
	storageDirPath: string
	/**
	 * 日志文件轮转配置。
	 *
	 * @remarks
	 * 默认按天切分文件，单个文件超过 5MB 时继续按序号拆分，可通过
	 * {@link LoggerRotationOptions} 调整周期、大小上限或整体关闭轮转。
	 */
	rotation?: LoggerRotationOptions
	/**
	 * 固定分类的启用状态和配置。
	 *
	 * @remarks
	 * `access`、`business`、`businessError`、`systemError`、`debug` 均默认启用。
	 * 值为 `true` 时按内置级别启用，值为 `false` 时关闭，对象值可覆盖级别和 bindings。
	 * 被关闭的固定分类仍保留稳定的导出单例，但在使用时会抛出“分类未启用”错误。
	 */
	fixedCategories?: FixedLoggerCategoriesOptions
	/**
	 * 初始化时预创建的自定义分类。
	 *
	 * @remarks
	 * 值为 `true` 时使用默认配置创建；值为 `false` 时跳过；对象值用于指定分类配置。
	 * 固定分类名不能出现在此处，请使用 {@link fixedCategories}。运行中也可以通过
	 * `await logger.createCategory(name, options)` 快速创建并登记自定义分类。
	 *
	 * @defaultValue `{}`
	 */
	categories?: Record<string, LoggerCategoryOptions | boolean>
	/**
	 * 所有分类的默认最低日志级别。
	 *
	 * @remarks
	 * 分类自身的 `level` 优先级更高。内置 `businessError`、`systemError` 使用 `error`，
	 * `access`、`business` 使用 `info`，`debug` 使用 `debug`。
	 *
	 * @defaultValue `info`
	 */
	level?: LevelWithSilentOrString
	/**
	 * 固定写入所有分类日志的基础字段。
	 *
	 * @remarks
	 * 未传入时使用 `{ pid, hostname }`。这些字段会写入每条日志的 `_meta_`，
	 * 不再占用 JSON 顶层。传入对象时使用该对象作为基础元信息；传入 `null` 时不写入。
	 */
	base?: Bindings | null
	/**
	 * 是否为每条日志采集 `caller` 和结构化 `stack`。
	 *
	 * @remarks
	 * 采集堆栈会产生额外开销。调用信息写入 `_meta_.caller` 和 `_meta_.stack`，
	 * 不会与业务字段冲突。高吞吐场景可以关闭。
	 *
	 * @defaultValue `true`
	 */
	captureStack?: boolean
	/**
	 * 每条日志最多保留的有效调用堆栈帧数，必须是大于 0 的整数。
	 *
	 * @defaultValue `10`
	 */
	stackTraceLimit?: number
	/**
	 * 是否同步写入日志文件。
	 *
	 * @remarks
	 * 异步模式吞吐量更高；需要确认日志已经落盘时调用 `logger.flush()` 或 `logger.close()`。
	 * 致命错误处理器和进程退出处理会执行同步刷新。
	 *
	 * @defaultValue `false`
	 */
	sync?: boolean
	/**
	 * 是否注册一次性的 `uncaughtExceptionMonitor` 处理器。
	 *
	 * @remarks
	 * Node.js 会将未处理的 Promise 拒绝提升为未捕获异常。监控处理器会将两类异常写入
	 * `systemError` 分类并同步刷新全部分类，但不会接管异常：Node.js 仍会照常向终端输出原始错误
	 * 并以非零状态退出。
	 * 如果 systemError 分类被显式关闭，则不会注册该监控处理器。
	 * `logger.close()` 会移除当前实例注册的处理器。已有全局异常策略、测试或嵌入式运行时应关闭。
	 *
	 * @defaultValue `true`
	 */
	registerFatalHandler?: boolean
	/**
	 * 自定义每条日志记录内容的钩子。
	 *
	 * @remarks
	 * 钩子在日志序列化后、写入文件前调用，可以增删顶层业务字段、`_meta_` 元字段或消息。
	 * 适合统一补充 traceId、环境标识，或把敏感字段移出顶层。
	 *
	 * @example
	 * ```ts
	 * await createLogger({
	 *   storageDirPath: './logs',
	 *   record: ({ data, meta, message }) => ({
	 *     data: { ...data, env: process.env.NODE_ENV },
	 *     meta: { ...meta, traceId: currentTraceId() },
	 *     message
	 *   })
	 * })
	 * ```
	 */
	record?: LoggerRecordHook
	/**
	 * 透传给 pino 的高级配置，例如 redact、serializers 或 customLevels。
	 *
	 * @remarks
	 * `name`、`level`、`base`、`timestamp` 以及 `formatters.level` 由本模块管理，因此不能在此设置。
	 * 自定义 `hooks.logMethod` 会在本模块注入 `_meta_` 后执行，`hooks.streamWrite` 会在本模块
	 * 整理好记录结构后执行；`redact`、`serializers`、`formatters.bindings`、`formatters.log`
	 * 等其他配置保持原样。
	 */
	pinoOptions?: Omit<
		PinoLoggerOptions,
		'base' | 'formatters' | 'hooks' | 'level' | 'name' | 'timestamp'
	> & {
		hooks?: PinoLoggerOptions['hooks']
		formatters?: Omit<NonNullable<PinoLoggerOptions['formatters']>, 'level'>
	}
}
