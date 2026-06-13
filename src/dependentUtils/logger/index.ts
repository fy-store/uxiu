import { isObject } from '../../utils/index.js'
import type { LoggerOptions, LoggerExpanded } from './types.js'
import type log4js from 'log4js'
import path from 'node:path'
export type * from './types.js'

let exitHandlerRegistered = false

class _Logger {
	/** log4js 实例 */
	logger: log4js.Log4js
	/** 崩溃日志模块 */
	// @ts-ignore
	crash: log4js.Logger
	/** 应用日志模块 */
	// @ts-ignore
	app: log4js.Logger
	/** 调试日志模块 */
	// @ts-ignore
	debug: log4js.Logger
	/** 控制台日志模块 */
	// @ts-ignore
	console: log4js.Logger

	private _storageDirPath: string

	constructor(
		private readonly log4js: log4js.Log4js,
		options: LoggerOptions
	) {
		if (!isObject(options)) {
			throw new Error('options must be an object !')
		}

		if (typeof options.storageDirPath !== 'string' || options.storageDirPath.trim() === '') {
			throw new Error('storageDirPath must be a non empty string !')
		}
		this._storageDirPath = options.storageDirPath

		if (options.expandCategories?.['logger']) {
			throw new Error('"logger" name can not use !')
		}

		const appenders: log4js.Configuration['appenders'] = {
			...this._createAppenders('crash'),
			...this._createAppenders('app'),
			...this._createAppenders('debug'),
			console: {
				type: 'console'
			}
		}
		const categories: log4js.Configuration['categories'] = {
			crash: {
				enableCallStack: true,
				level: 'error',
				appenders: ['crash']
			},

			app: {
				enableCallStack: true,
				level: 'info',
				appenders: ['app']
			},

			debug: {
				enableCallStack: true,
				level: 'debug',
				appenders: ['debug']
			},

			console: {
				enableCallStack: true,
				level: 'all',
				appenders: ['console']
			},

			default: {
				enableCallStack: true,
				level: 'info',
				appenders: ['app']
			}
		}

		for (const [name, enabled] of Object.entries(options.expandCategories ?? {})) {
			if (!enabled) continue
			Object.assign(appenders, this._createAppenders(name))
			categories[name] = {
				enableCallStack: true,
				level: 'info',
				appenders: [name]
			}
		}

		const mergedCategories = {
			...(options.log4jsConfiguration?.categories ?? {}),
			...categories
		}

		this.logger = this.log4js.configure({
			...(options.log4jsConfiguration ?? {}),
			appenders: {
				...(options.log4jsConfiguration?.appenders ?? {}),
				...appenders
			},
			categories: mergedCategories
		})

		for (const name of Object.keys(mergedCategories)) {
			if (name === 'default') continue
			// @ts-ignore
			this[name] = this.logger.getLogger(name)
		}

		// 崩溃异常记录
		if (options.crashAutoRegister || options.crashAutoRegister === void 0) {
			process.on('uncaughtException', (err, origin) => {
				console.error(err)
				const span = '    '
				this.crash.error('进程崩溃', err, '\n')
				this.crash.error(
					`\n${span}异常来源: ${origin}\n` +
						`${span}错误类型: ${err?.name}\n` +
						`${span}错误信息: ${err?.message}\n` +
						`${span}错误堆栈: ${err?.stack}`
				)

				this.log4js.shutdown(() => {
					process.exit(1)
				})
			})
		}
	}

	private _createAppenders(name: string) {
		const appenders: log4js.Configuration['appenders'] = {
			[name]: {
				type: 'dateFile',
				filename: path.join(this._storageDirPath, `${name}/${name}.log`),
				pattern: 'yyyy-MM-dd',
				keepFileExt: true,
				maxLogSize: 1024 * 1024,
				fileNameSep: '_',
				numBackups: 500,
				layout: {
					type: 'pattern',
					pattern:
						'日志级别: %p%n' +
						'触发主机: %h%n' +
						'触发时间: %d{yyyy-MM-dd hh:mm:ss}%n' +
						'触发路径: %f%n' +
						'触发位置: %f:%l:%o%n' +
						'调用堆栈: %n%s%n' +
						'日志信息: %m%n'
				}
			}
		}
		return appenders
	}
}

export type Logger<T extends Record<string, boolean> = {}> = _Logger & LoggerExpanded<T>

/**
 * 创建日志实例
 */
export async function createLogger<const T extends Record<string, boolean> = {}>(
	options: LoggerOptions<T>
): Promise<Logger<T>> {
	const { default: log4js } = await import('log4js')

	// 未正常退出时将未记录完的日志继续记录
	if (!exitHandlerRegistered) {
		process.on('exit', () => {
			log4js.shutdown()
		})
		exitHandlerRegistered = true
	}

	return new _Logger(log4js, options) as Logger<T>
}
