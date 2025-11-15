import type { LoggerOptions } from './types.js'
import log4js from 'log4js'
import path from 'node:path'
export type *  from './types.js'

export class Logger {
	/** log4js 实例 */
	logger: log4js.Log4js
	/** 崩溃日志模块 */
	collapse: log4js.Logger
	/** 应用日志模块 */
	app: log4js.Logger
	/** 调试日志模块 */
	debug: log4js.Logger

	constructor(options: LoggerOptions) {
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

			default: {
				enableCallStack: true,
				level: 'info',
				appenders: ['app']
			}
		}

		this.logger = log4js.configure({
			...(options.log4jsConfiguration ?? {}),
			appenders: {
				...(options.log4jsConfiguration?.appenders ?? {}),
				...appenders
			},
			categories: {
				...(options.log4jsConfiguration?.categories ?? {}),
				...categories
			}
		})

		this.collapse = this.logger.getLogger('collapse')
		this.app = this.logger.getLogger('app')
		this.debug = this.logger.getLogger('debug')

		// 未正常退出时将未记录完的日志继续记录
		process.on('exit', () => {
			log4js.shutdown()
		})

		// 崩溃异常记录
		process.on('uncaughtException', (err, origin) => {
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
	}
}
