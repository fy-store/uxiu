import { isObject } from '../../utils/index.js'
import type {
	CategoryLogger,
	FixedLoggerCategoryName,
	LoggerCallSite,
	LoggerCategoryOptions,
	LoggerOptions
} from './types.js'
import type {
	DestinationStream,
	Logger as PinoLogger,
	LoggerOptions as PinoLoggerOptions
} from 'pino'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
export type * from './types.js'

interface FixedCategoryDefinition {
	enabled: boolean
	options: LoggerCategoryOptions
}

const FIXED_CATEGORY_DEFINITIONS = {
	access: { enabled: true, options: { level: 'info' } },
	business: { enabled: true, options: { level: 'info' } },
	businessError: { enabled: true, options: { level: 'error' } },
	systemError: { enabled: true, options: { level: 'error' } },
	debug: { enabled: true, options: { level: 'debug' } }
} as const satisfies Record<FixedLoggerCategoryName, FixedCategoryDefinition>

const FIXED_CATEGORY_NAMES = Object.keys(FIXED_CATEGORY_DEFINITIONS) as FixedLoggerCategoryName[]
const FIXED_CATEGORY_NAME_SET = new Set<string>(FIXED_CATEGORY_NAMES)
const CATEGORY_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/
const LOGGER_MODULE_PATH = path.normalize(fileURLToPath(import.meta.url))
const initializeLogger = Symbol('initializeLogger')
const getCategoryTarget = Symbol('getCategoryTarget')
let exitHandlerRegistered = false

/** pino 文件目标在生命周期管理中使用的 SonicBoom 方法子集。 */
interface ManagedDestination extends DestinationStream {
	fd?: number
	flushSync(): void
	end(): void
	on(event: 'close' | 'error' | 'finish' | 'ready', listener: (...args: any[]) => void): this
	once(event: 'close' | 'error' | 'finish' | 'ready', listener: (...args: any[]) => void): this
	removeListener(event: 'close' | 'error' | 'finish' | 'ready', listener: (...args: any[]) => void): this
}

/** 动态导入的 pino 模块形状。 */
interface PinoModule {
	default: typeof import('pino')
}

/** 校验分类名，阻止路径分隔符和 `..` 等目录逃逸输入。 */
function validateCategoryName(name: string): void {
	if (!CATEGORY_NAME_PATTERN.test(name)) {
		throw new Error(`invalid logger category name: ${name}`)
	}
}

/** 将堆栈中的文件 URL 或路径统一为当前平台路径。 */
function normalizeFileName(file: string): string {
	if (!file.startsWith('file://')) return path.normalize(file)
	try {
		return path.normalize(fileURLToPath(file))
	} catch {
		return file
	}
}

/** 将一行 V8 stack trace 转换为可序列化的调用位置。 */
function parseCallSite(line: string): LoggerCallSite | undefined {
	let value = line.trim().replace(/^at\s+/, '')
	let functionName: string | undefined
	if (value.endsWith(')')) {
		const locationStart = value.lastIndexOf(' (')
		if (locationStart >= 0) {
			functionName = value.slice(0, locationStart).replace(/^async\s+/, '')
			value = value.slice(locationStart + 2, -1)
		}
	}

	const match = /^(.*):(\d+):(\d+)$/.exec(value)
	if (!match) return
	return {
		file: normalizeFileName(match[1]),
		line: Number(match[2]),
		column: Number(match[3]),
		...(functionName ? { function: functionName } : {})
	}
}

/** 捕获并过滤 logger、pino 和 Node.js 内部堆栈帧。 */
function captureCallStack(limit: number): LoggerCallSite[] {
	const holder: { stack?: string } = {}
	Error.captureStackTrace(holder, captureCallStack)
	return (holder.stack?.split('\n').slice(1) ?? [])
		.map(parseCallSite)
		.filter((site): site is LoggerCallSite => {
			if (!site) return false
			if (site.file === LOGGER_MODULE_PATH) return false
			if (site.file.startsWith('node:')) return false
			return !/[\\/]node_modules[\\/](?:\.pnpm[\\/])?pino(?:@|[\\/])/.test(site.file)
		})
		.slice(0, limit)
}

/** 按 pino 参数约定注入调用位置和结构化堆栈。 */
function addCallMetadata(args: unknown[], stackTraceLimit: number): unknown[] {
	const stack = captureCallStack(stackTraceLimit)
	const metadata = { caller: stack[0], stack }
	const [first, ...rest] = args

	if (first instanceof Error) return [{ err: first, ...metadata }, ...rest]
	if (isObject(first) && !Array.isArray(first)) return [{ ...first, ...metadata }, ...rest]
	return [metadata, ...args]
}

/**
 * 仅在日志真正初始化时动态加载 pino，并为缺失的可选 peer 依赖提供明确错误。
 */
async function loadPino(): Promise<PinoModule> {
	try {
		return (await import('pino')) as unknown as PinoModule
	} catch (error) {
		const code = isObject(error) && 'code' in error ? error.code : undefined
		const message = error instanceof Error ? error.message : String(error)
		if (
			(code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') &&
			/(?:^|["'])pino(?:["']|$)/.test(message)
		) {
			throw new Error(
				'日志模块需要可选依赖 "pino"，请先运行 "pnpm add pino"（或使用当前包管理器安装 pino）。',
				{ cause: error }
			)
		}
		throw error
	}
}

/**
 * 进程级日志分类注册中心。
 *
 * @remarks
 * 模块只创建一个 LoggerManager。固定分类通过稳定的代理实例导出，自定义分类也统一登记在此实例中。
 * pino 和文件目标直到首次调用 {@link createLogger} 时才创建。
 */
class LoggerManager {
	private pino?: PinoModule
	private options?: LoggerOptions
	private initializing?: Promise<void>
	private closing?: Promise<void>
	private initialized = false
	private readonly categoryLoggers = new Map<string, PinoLogger>()
	private readonly destinations = new Map<string, ManagedDestination>()
	private readonly categoryCreations = new Map<string, Promise<CategoryLogger>>()
	private fatalHandler?: (error: Error, origin: NodeJS.UncaughtExceptionOrigin) => void
	private rejectionHandler?: (reason: unknown, promise: Promise<unknown>) => void

	/** 访问日志单例。输出 HTTP 方法、路径、状态码、耗时等请求信息。 */
	get access(): CategoryLogger {
		return accessLogger
	}

	/** 业务日志单例。用于记录正常业务事件、状态变化和关键操作。 */
	get business(): CategoryLogger {
		return businessLogger
	}

	/** 业务错误日志单例。用于记录可预期、可恢复的业务或请求处理错误。 */
	get businessError(): CategoryLogger {
		return businessErrorLogger
	}

	/** 系统错误日志单例。只用于程序崩溃或理论上不应在运行期出现的异常。 */
	get systemError(): CategoryLogger {
		return systemErrorLogger
	}

	/** Debug 日志单例，默认启用且最低级别为 debug。 */
	get debug(): CategoryLogger {
		return debugLogger
	}

	/**
	 * 当前已经创建并由退出流程统一管理的分类快照。
	 *
	 * @remarks
	 * 返回的是新的只读 Map 视图；修改该 Map 不会影响内部注册中心。固定分类的值为稳定导出单例。
	 */
	get categories(): ReadonlyMap<string, CategoryLogger> {
		return new Map(
			[...this.categoryLoggers].map(([name, category]) => [name, toPublicCategory(name, category)])
		)
	}

	/** 判断日志模块是否已经初始化且指定分类已经启用或创建。 */
	hasCategory(name: string): boolean {
		return this.initialized && this.categoryLoggers.has(name)
	}

	/**
	 * 快速创建或取得一个分类日志，并将其加入进程退出时统一刷新的分类集合。
	 *
	 * @param name - 分类名，只允许字母、数字、下划线和连字符。
	 * @param categoryOptions - 仅在首次创建时生效的级别、bindings 和启用状态。
	 * @returns 目标文件 ready 后兑现的 Promise。固定分类返回进程级单例，自定义分类返回已登记的 pino logger。
	 * @throws 日志未初始化、分类名非法或日志已经关闭时抛出错误。
	 */
	async createCategory(
		name: string,
		categoryOptions: LoggerCategoryOptions = {}
	): Promise<CategoryLogger> {
		this.assertInitialized()
		validateCategoryName(name)
		const existing = this.categoryLoggers.get(name)
		if (existing) return toPublicCategory(name, existing)

		const fixedDefinition = FIXED_CATEGORY_DEFINITIONS[name as FixedLoggerCategoryName]
		const options = fixedDefinition
			? { ...fixedDefinition.options, ...categoryOptions }
			: categoryOptions
		const pending = this.categoryCreations.get(name)
		if (pending) return pending
		const creation = this.createAndRegisterCategory(name, options)
		this.categoryCreations.set(name, creation)
		try {
			return await creation
		} finally {
			this.categoryCreations.delete(name)
		}
	}

	/**
	 * 取得已经启用或创建的分类。
	 *
	 * @throws 分类尚未登记时抛出错误；新分类请先调用并等待 {@link createCategory}。
	 */
	category(name: string): CategoryLogger {
		this.assertInitialized()
		validateCategoryName(name)
		const category = this.categoryLoggers.get(name)
		if (!category) throw new Error(`日志分类 "${name}" 尚未创建，请先调用 await logger.createCategory(name)。`)
		return toPublicCategory(name, category)
	}

	/**
	 * 等待当前已登记分类的缓冲日志写入文件，但保持所有文件目标打开。
	 *
	 * @returns 全部分类刷新完成后兑现的 Promise；写入失败时拒绝。
	 *
	 * @remarks
	 * 仅在进程还会继续运行、但下一步必须确认日志已落盘时调用，例如测试马上读取日志文件、
	 * 审计记录写入后才向外部系统确认成功，或轮转/归档日志文件之前。调用完成后可以继续写日志。
	 * 不要在每个请求结束时调用，否则会损失 pino 异步缓冲带来的吞吐优势。
	 * 应用最终关闭应使用 {@link close}，不要只调用 flush 后直接退出。
	 */
	async flush(): Promise<void> {
		if (!this.initialized) return
		await Promise.all(
			[...this.categoryLoggers.values()].map(
				(category) =>
					new Promise<void>((resolve, reject) => {
						category.flush((error) => (error ? reject(error) : resolve()))
					})
			)
		)
	}

	/**
	 * 同步刷新所有已登记分类。
	 *
	 * @remarks
	 * 此方法会阻塞事件循环，只适用于已经无法等待 Promise 的同步退出阶段。模块会在正常 `exit`、
	 * `uncaughtException` 和 `unhandledRejection` 流程中自动调用，普通业务代码、请求处理和常规
	 * SIGTERM/SIGINT 优雅退出不应手动调用。自定义同步崩溃处理器且关闭了 registerFatalHandler 时，
	 * 才需要在 `process.exit()` 前显式调用。它只刷新，不关闭文件，也不会移除事件监听器。
	 */
	flushSync(): void {
		for (const destination of this.destinations.values()) {
			try {
				destination.flushSync()
			} catch {
				// 退出路径不能让单个异常目标阻止其他分类刷新。
			}
		}
	}

	/**
	 * 完成日志模块的优雅关闭。
	 *
	 * @returns 等待正在创建的分类完成、刷新全部缓冲区并关闭全部文件后兑现的 Promise。
	 *
	 * @remarks
	 * 应在应用最终停止时调用：先停止接收 HTTP 请求、队列任务或定时任务，再 `await logger.close()`，
	 * 最后退出进程。典型场景包括 SIGTERM/SIGINT 处理器、测试 afterEach/afterAll 和应用主动 shutdown。
	 * close 会移除模块注册的崩溃处理器并重置进程级单例；完成后不能继续使用已有分类实例，
	 * 需要重新调用 createLogger 才能再次记录。重复调用 close 是安全的。
	 */
	async close(): Promise<void> {
		if (this.closing) return this.closing
		if (!this.initialized) return
		this.closing = this.closeAll()
		try {
			await this.closing
		} finally {
			this.closing = undefined
		}
	}

	private async closeAll(): Promise<void> {
		this.removeFailureHandlers()
		await Promise.allSettled(this.categoryCreations.values())
		await this.flush()
		await Promise.all([...this.destinations.values()].map(closeDestination))
		this.categoryLoggers.clear()
		this.destinations.clear()
		this.pino = undefined
		this.options = undefined
		this.initialized = false
	}

	async [initializeLogger](options: LoggerOptions): Promise<this> {
		if (this.closing) await this.closing
		if (this.initialized) return this
		if (this.initializing) {
			await this.initializing
			return this
		}

		this.validateOptions(options)
		this.initializing = this.initialize(options)
		try {
			await this.initializing
			return this
		} finally {
			this.initializing = undefined
		}
	}

	[getCategoryTarget](name: FixedLoggerCategoryName): PinoLogger {
		this.assertInitialized()
		const category = this.categoryLoggers.get(name)
		if (!category) {
			throw new Error(
				`固定日志分类 "${name}" 未启用，请在 createLogger/createApp 的 loggerOptions.fixedCategories 中开启。`
			)
		}
		return category
	}

	private async initialize(options: LoggerOptions): Promise<void> {
		const pino = await loadPino()
		this.pino = pino
		this.options = options
		const created: Array<{
			name: string
			category: PinoLogger
			destination: ManagedDestination
		}> = []
		try {
			for (const name of FIXED_CATEGORY_NAMES) {
				const definition = FIXED_CATEGORY_DEFINITIONS[name]
				const configured = options.fixedCategories?.[name]
				const enabled =
					configured === undefined
						? definition.enabled
						: configured !== false && (configured === true || configured.enabled !== false)
				if (!enabled) continue
				created.push({
					name,
					...this.createPinoLogger(name, {
					...definition.options,
					...(configured !== true && configured !== false ? configured : {})
					})
				})
			}

			for (const [name, categoryOptions] of Object.entries(options.categories ?? {})) {
				validateCategoryName(name)
				if (FIXED_CATEGORY_NAME_SET.has(name)) {
					throw new Error(`固定日志分类 "${name}" 请通过 fixedCategories 配置`)
				}
				if (categoryOptions === false) continue
				created.push({
					name,
					...this.createPinoLogger(name, categoryOptions === true ? {} : categoryOptions)
				})
			}

			await Promise.all(created.map(({ destination }) => waitForDestinationReady(destination)))
			for (const { name, category, destination } of created) {
				this.categoryLoggers.set(name, category)
				this.destinations.set(name, destination)
			}
			this.initialized = true
			this.registerFailureHandlers()
			registerExitHandler()
		} catch (error) {
			for (const { destination } of created) destination.end()
			this.categoryLoggers.clear()
			this.destinations.clear()
			this.pino = undefined
			this.options = undefined
			throw error
		}
	}

	private createPinoLogger(
		name: string,
		categoryOptions: LoggerCategoryOptions
	): { category: PinoLogger; destination: ManagedDestination } {
		if (!this.pino || !this.options) throw new Error('logger initialization is incomplete')
		const directory = path.join(this.options.storageDirPath, name)
		fs.mkdirSync(directory, { recursive: true })
		const destination = this.pino.default.destination({
			dest: path.join(directory, `${name}.log`),
			sync: this.options.sync ?? false
		}) as ManagedDestination
		const category = this.createPinoInstance(name, categoryOptions, destination)
		return { category, destination }
	}

	private async createAndRegisterCategory(
		name: string,
		categoryOptions: LoggerCategoryOptions
	): Promise<CategoryLogger> {
		const { category, destination } = this.createPinoLogger(name, categoryOptions)
		try {
			await waitForDestinationReady(destination)
		} catch (error) {
			destination.end()
			throw error
		}
		this.categoryLoggers.set(name, category)
		this.destinations.set(name, destination)
		return toPublicCategory(name, category)
	}

	private createPinoInstance(
		name: string,
		categoryOptions: LoggerCategoryOptions,
		destination: ManagedDestination
	): PinoLogger {
		const pino = this.pino!
		const options = this.options!
		const stackTraceLimit = options.stackTraceLimit ?? 10
		const captureStack = options.captureStack !== false
		const pinoOptions = options.pinoOptions ?? {}
		const userLogMethod = pinoOptions.hooks?.logMethod
		const loggerOptions: PinoLoggerOptions = {
			...pinoOptions,
			name,
			level: categoryOptions.enabled === false ? 'silent' : (categoryOptions.level ?? options.level ?? 'info'),
			base: options.base,
			timestamp: pinoOptions.timestamp ?? pino.default.stdTimeFunctions.isoTime,
			hooks: {
				...pinoOptions.hooks,
				logMethod(args, method, level) {
					const nextArgs = captureStack ? addCallMetadata(args, stackTraceLimit) : args
					if (userLogMethod) {
						return userLogMethod.call(this, nextArgs as Parameters<typeof method>, method, level)
					}
					return method.apply(this, nextArgs as Parameters<typeof method>)
				}
			}
		}
		return pino.default(loggerOptions, destination).child({
			category: name,
			...(categoryOptions.bindings ?? {})
		})
	}

	private registerFailureHandlers(): void {
		if (this.options?.registerFatalHandler === false || !this.categoryLoggers.has('systemError')) return
		this.fatalHandler = (error, origin) => {
			this.recordSystemFailure({ err: error, origin, event: 'uncaughtException' }, '进程未捕获异常')
		}
		this.rejectionHandler = (reason) => {
			const payload =
				reason instanceof Error
					? { err: reason, event: 'unhandledRejection' }
					: { reason, event: 'unhandledRejection' }
			this.recordSystemFailure(payload, '进程存在未处理的 Promise 拒绝')
		}
		process.once('uncaughtException', this.fatalHandler)
		process.once('unhandledRejection', this.rejectionHandler)
	}

	private removeFailureHandlers(): void {
		if (this.fatalHandler) process.removeListener('uncaughtException', this.fatalHandler)
		if (this.rejectionHandler) process.removeListener('unhandledRejection', this.rejectionHandler)
		this.fatalHandler = undefined
		this.rejectionHandler = undefined
	}

	private recordSystemFailure(payload: Record<string, unknown>, message: string): never {
		try {
			this.categoryLoggers.get('systemError')?.fatal(payload, message)
		} finally {
			this.flushSync()
			process.exit(1)
		}
	}

	private validateOptions(options: LoggerOptions): void {
		if (!isObject(options) || Array.isArray(options)) throw new Error('options must be an object')
		if (typeof options.storageDirPath !== 'string' || options.storageDirPath.trim() === '') {
			throw new Error('storageDirPath must be a non-empty string')
		}
		if (
			options.stackTraceLimit !== undefined &&
			(!Number.isInteger(options.stackTraceLimit) || options.stackTraceLimit < 1)
		) {
			throw new Error('stackTraceLimit must be a positive integer')
		}
	}

	private assertInitialized(): void {
		if (!this.initialized) {
			throw new Error('日志模块尚未初始化，请先调用 createLogger() 或在 createApp 中配置 loggerOptions。')
		}
	}
}

/** {@link createLogger} 返回的进程级日志管理单例类型。 */
export type Logger = LoggerManager

/** 等待异步文件目标获得可同步刷新的文件描述符。 */
function waitForDestinationReady(destination: ManagedDestination): Promise<void> {
	if (typeof destination.fd === 'number' && destination.fd >= 0) return Promise.resolve()
	return new Promise((resolve, reject) => {
		const ready = () => {
			cleanup()
			resolve()
		}
		const fail = (error: Error) => {
			cleanup()
			reject(error)
		}
		const cleanup = () => {
			destination.removeListener('ready', ready)
			destination.removeListener('error', fail)
		}
		destination.once('ready', ready)
		destination.once('error', fail)
	})
}

/** 等待单个 SonicBoom 目标触发 finish/close，并正确传播写入错误。 */
function closeDestination(destination: ManagedDestination): Promise<void> {
	return new Promise((resolve, reject) => {
		let settled = false
		const finish = () => {
			if (settled) return
			settled = true
			cleanup()
			resolve()
		}
		const fail = (error: Error) => {
			if (settled) return
			settled = true
			cleanup()
			reject(error)
		}
		const cleanup = () => {
			destination.removeListener('close', finish)
			destination.removeListener('finish', finish)
			destination.removeListener('error', fail)
		}
		destination.once('close', finish)
		destination.once('finish', finish)
		destination.once('error', fail)
		destination.end()
	})
}

/** 创建一个稳定代理，将所有属性和方法转发给当前启用的固定分类实例。 */
function createFixedCategoryFacade(name: FixedLoggerCategoryName): CategoryLogger {
	return new Proxy({} as PinoLogger, {
		get(_target, property) {
			const category = logger[getCategoryTarget](name)
			const value = Reflect.get(category, property, category)
			return typeof value === 'function' ? value.bind(category) : value
		},
		set(_target, property, value) {
			const category = logger[getCategoryTarget](name)
			return Reflect.set(category, property, value, category)
		}
	})
}

function toPublicCategory(name: string, category: PinoLogger): CategoryLogger {
	if (!FIXED_CATEGORY_NAME_SET.has(name)) return category
	return getFixedCategoryFacade(name as FixedLoggerCategoryName)
}

function getFixedCategoryFacade(name: FixedLoggerCategoryName): CategoryLogger {
	switch (name) {
		case 'access':
			return accessLogger
		case 'business':
			return businessLogger
		case 'businessError':
			return businessErrorLogger
		case 'systemError':
			return systemErrorLogger
		case 'debug':
			return debugLogger
	}
}

function registerExitHandler(): void {
	if (exitHandlerRegistered) return
	process.once('exit', () => logger.flushSync())
	exitHandlerRegistered = true
}

/** 进程内唯一的日志分类注册中心；导入本对象不会加载 pino。 */
export const logger = new LoggerManager()

/** 访问日志固定单例；需先通过 createLogger 或 createApp 启用日志。 */
export const accessLogger = createFixedCategoryFacade('access')
/** 业务日志固定单例；可在路由、任务和其他业务模块中直接导入。 */
export const businessLogger = createFixedCategoryFacade('business')
/** 业务错误日志固定单例；用于可预期或可恢复的业务错误。 */
export const businessErrorLogger = createFixedCategoryFacade('businessError')
/** 系统错误日志固定单例；只用于崩溃和不应在运行期出现的错误。 */
export const systemErrorLogger = createFixedCategoryFacade('systemError')
/** Debug 日志固定单例，默认启用；可通过 fixedCategories.debug 显式关闭。 */
export const debugLogger = createFixedCategoryFacade('debug')

/**
 * 初始化并返回进程级日志单例。
 *
 * @remarks
 * pino 在此函数首次执行时动态导入；仅导入 `uxiu/node` 或固定分类不会加载 pino。
 * 同一初始化周期内重复调用会返回同一实例并保留第一次配置。调用 `logger.close()` 后可以重新初始化。
 * 所有固定和自定义分类都会被登记，并在正常 exit、崩溃或显式 close 时统一刷新。
 *
 * @throws pino 未安装时抛出包含安装命令的明确错误；配置或分类名非法时也会抛出错误。
 */
export async function createLogger(options: LoggerOptions): Promise<Logger> {
	return logger[initializeLogger](options)
}
