import { describe, it, expect } from 'vitest'
import { createApp } from './index.js'
import { businessLogger } from '../logger/index.js'
import type { Logger as PinoLogger } from 'pino'
import path from 'node:path'
import fs from 'node:fs'

describe('createApp()', () => {
	it('默认配置', async () => {
		let beforeInit = false
		let inited = false
		let beforeMount = false
		let mounted = false
		const app = await createApp({
			port: 3324,
			beforeInit() {
				beforeInit = true
			},
			inited() {
				inited = true
			},
			beforeMount() {
				beforeMount = true
			},
			mounted() {
				mounted = true
			}
		})
		await new Promise((resolve, reject) => {
			app.server.close((err) => {
				if (err) {
					reject(err)
				} else {
					resolve(null)
				}
			})
		})
		expect(app.port).toBe(3324)
		expect(app.env).toBe('production')
		expect(app.koaOptions.env).toBe('production')
		expect(beforeInit).toBe(true)
		expect(inited).toBe(true)
		expect(beforeMount).toBe(true)
		expect(mounted).toBe(true)
	})

	it('指定端口', async () => {
		const app = await createApp({
			port: 3000
		})
		await new Promise((resolve, reject) => {
			app.server.close((err) => {
				if (err) {
					reject(err)
				} else {
					resolve(null)
				}
			})
		})
		expect(app.port).toBe(3000)
	})

	it('创建自定义分类日志', async () => {
		const logsPath = path.join(import.meta.dirname, '../../../logs/create-app')
		fs.rmSync(logsPath, { recursive: true, force: true })

		const app = await createApp({
			port: 0,
			loggerOptions: {
				storageDirPath: logsPath,
				registerFatalHandler: false,
				categories: {
					hh: { bindings: { feature: 'create-app' } },
					disabled: false
				}
			},
			inited(ctx) {
				const hh: PinoLogger = ctx.logger!.category('hh')
				expect(typeof hh.info).toBe('function')
			}
		})

		const hh: PinoLogger = app.logger!.category('hh')
		hh.info('扩展日志')
		businessLogger.info({ source: 'outside-route' }, '路由外业务日志')

		await new Promise<void>((resolve, reject) => {
			app.server.close((error) => (error ? reject(error) : resolve()))
		})
		await app.logger!.close()
		expect(fs.existsSync(path.join(logsPath, 'hh/hh.log'))).toBe(true)
		expect(fs.readFileSync(path.join(logsPath, 'business/business.log'), 'utf8')).toContain(
			'路由外业务日志'
		)
		fs.rmSync(logsPath, { recursive: true, force: true })
	})

	it('只派发请求事件，不主动写入访问或业务错误日志', async () => {
		const logsPath = path.join(import.meta.dirname, '../../../logs/create-app-http')
		fs.rmSync(logsPath, { recursive: true, force: true })
		const successPaths: string[] = []
		const errorMessages: string[] = []
		const endPaths: string[] = []
		const application = await createApp({
			port: 0,
			loggerOptions: {
				storageDirPath: logsPath,
				registerFatalHandler: false,
				sync: true,
				fixedCategories: {
					access: true,
					business: false,
					businessError: true,
					systemError: false,
					debug: false
				}
			},
			inited({ app }) {
				app.use(async (ctx, next) => {
					ctx.bus.on('success', () => successPaths.push(ctx.path))
					ctx.bus.on('error', (error) => {
						errorMessages.push(error instanceof Error ? error.message : String(error))
					})
					ctx.bus.on('end', () => endPaths.push(ctx.path))
					await next()
				})
				app.use((ctx) => {
					if (ctx.path === '/error') throw new Error('route failed')
					ctx.status = 204
				})
			}
		})
		const address = application.server.address()
		if (!address || typeof address === 'string') throw new Error('expected TCP address')

		await fetch(`http://127.0.0.1:${address.port}/ok`)
		await fetch(`http://127.0.0.1:${address.port}/error`)
		await new Promise<void>((resolve, reject) => {
			application.server.close((error) => (error ? reject(error) : resolve()))
		})
		await application.logger!.close()

		expect(successPaths).toEqual(['/ok'])
		expect(errorMessages).toEqual(['route failed'])
		expect(endPaths).toEqual(['/ok', '/error'])
		expect(fs.readFileSync(path.join(logsPath, 'access/access.log'), 'utf8')).toBe('')
		expect(fs.readFileSync(path.join(logsPath, 'businessError/businessError.log'), 'utf8')).toBe('')
		expect(fs.existsSync(path.join(logsPath, 'business'))).toBe(false)
		expect(fs.existsSync(path.join(logsPath, 'systemError'))).toBe(false)
		fs.rmSync(logsPath, { recursive: true, force: true })
	})
})
