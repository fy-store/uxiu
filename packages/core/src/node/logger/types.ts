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
 * 日志方法的对象参数会展开到最终的单行 JSON 顶层。
 *
 * @example
 * ```ts
 * logger.business.info({ orderId: 42 }, 'order created')
 * const requestLogger = logger.access.child({ requestId: 'req-1' })
 * requestLogger.info({ path: '/health' }, 'request completed')
 * ```
 */
export type CategoryLogger = PinoLogger

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
	 * 内置的 `category` 字段由模块管理；其余字段会作为 pino child bindings 写入。
	 * 适合放置 domain、module、component 等分类级上下文。
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
	 * 未传入时保留 pino 默认的 `pid` 和 `hostname`。传入对象时使用该对象作为 pino base；
	 * 传入 `null` 时不写入任何 pino 基础字段。分类名称仍会通过 `category` 字段单独写入。
	 */
	base?: Bindings | null
	/**
	 * 是否为每条日志采集 `caller` 和结构化 `stack`。
	 *
	 * @remarks
	 * 采集堆栈会产生额外开销。自动生成的 `caller`、`stack` 会覆盖日志对象中的同名字段，
	 * 以保证调用信息可信。高吞吐场景可以关闭。
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
	 * 透传给 pino 的高级配置，例如 redact、serializers、timestamp、formatters 或 customLevels。
	 *
	 * @remarks
	 * `name`、`level`、`base` 由本模块按分类管理，因此不能在此设置。
	 * 自定义 `hooks.logMethod` 会在本模块注入 `caller` 和 `stack` 后执行；
	 * `hooks.streamWrite` 等其他 hook 会保持原样。
	 */
	pinoOptions?: Omit<PinoLoggerOptions, 'base' | 'hooks' | 'level' | 'name'> & {
		hooks?: PinoLoggerOptions['hooks']
	}
}
