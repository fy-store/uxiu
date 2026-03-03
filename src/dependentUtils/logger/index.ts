import { isObject } from '../../utils/index.js'
import type { LoggerOptions, LoggerExpanded } from './types.js'
import log4js from 'log4js'
import path from 'node:path'
export type * from './types.js'

// 未正常退出时将未记录完的日志继续记录
if (typeof process !== 'undefined') {
	process.on('exit', () => {
		log4js.shutdown()
	})
}
let flag = false
// 内部实现类，导出时通过带泛型的构造签名包装以获得类型推断
class _Logger {
	/** log4js 实例 */
	logger: log4js.Log4js
	/** 崩溃日志模块 */
	// @ts-ignore
	collapse: log4js.Logger
	/** 应用日志模块 */
	// @ts-ignore
	app: log4js.Logger
	/** 调试日志模块 */
	// @ts-ignore
	debug: log4js.Logger
	/** 控制台日志模块 */
	// @ts-ignore
	console: log4js.Logger

	constructor(options: LoggerOptions) {
		if (!isObject(options)) {
			throw new Error('options must be an object !')
		}

		if (typeof options.storageDirPath !== 'string' || options.storageDirPath.trim() === '') {
			throw new Error('storageDirPath must be a non empty string !')
		}

		if (options.expandCategories?.['logger']) {
			throw new Error('"logger" name can not use !')
		}

		const appenders: log4js.Configuration['appenders'] = {
			collapse: {
				type: 'dateFile',
				filename: path.join(options.storageDirPath, 'collapse/collapse.log'),
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
			},
			app: {
				type: 'dateFile',
				filename: path.join(options.storageDirPath, 'app/app.log'),
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
			},
			debug: {
				type: 'dateFile',
				filename: path.join(options.storageDirPath, 'debug/debug.log'),
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
			},
			console: {
				type: 'console'
			}
		}
		const categories: log4js.Configuration['categories'] = {
			collapse: {
				enableCallStack: true,
				level: 'error',
				appenders: ['collapse']
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
			appenders[name] = {
				type: 'dateFile',
				filename: path.join(options.storageDirPath, `${name}/${name}.log`),
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

		this.logger = log4js.configure({
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
		if ((options.collapseAutoRegister || options.collapseAutoRegister === void 0) && !flag) {
			process.on('uncaughtException', (err, origin) => {
				console.error(err)
				const span = '    '
				this.collapse.error('进程崩溃', err, '\n')
				this.collapse.error(
					`\n${span}异常来源: ${origin}\n` +
						`${span}错误类型: ${err?.name}\n` +
						`${span}错误信息: ${err?.message}\n` +
						`${span}错误堆栈: ${err?.stack}`
				)

				log4js.shutdown(() => {
					process.exit(1)
				})
			})
			flag = true
		}
	}
}

// 通过构造函数签名包装，实现基于 expandCategories 的类型推断
export type Logger<T extends Record<string, boolean> = {}> = _Logger & LoggerExpanded<T>
export const Logger: {
	new <T extends Record<string, boolean> = {}>(opts: LoggerOptions<T>): Logger<T>
} = _Logger as unknown as {
	new <T extends Record<string, boolean> = {}>(opts: LoggerOptions<T>): Logger<T>
}
