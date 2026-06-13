import { describe, it, expect } from 'vitest'
import { createApp } from './index.js'
import type { Logger as Log4jsLogger } from 'log4js'
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

	it('根据 expandCategories 推导扩展日志类型', async () => {
		const logsPath = path.join(import.meta.dirname, '../../../logs/create-app')
		fs.rmSync(logsPath, { recursive: true, force: true })

		const app = await createApp({
			port: 0,
			loggerOptions: {
				storageDirPath: logsPath,
				crashAutoRegister: false,
				expandCategories: {
					hh: true,
					disabled: false
				}
			},
			inited(ctx) {
				const hh: Log4jsLogger = ctx.logger!.hh
				expect(typeof hh.info).toBe('function')
				// @ts-expect-error false 分类不会创建 logger
				ctx.logger!.disabled
			}
		})

		const hh: Log4jsLogger = app.logger!.hh
		hh.info('扩展日志')
		// @ts-expect-error false 分类不会创建 logger
		app.logger!.disabled

		await new Promise<void>((resolve, reject) => {
			app.server.close((error) => (error ? reject(error) : resolve()))
		})
		await new Promise<void>((resolve, reject) => {
			app.logger!.logger.shutdown((error) => (error ? reject(error) : resolve()))
		})
		expect(fs.existsSync(path.join(logsPath, 'hh/hh.log'))).toBe(true)
		fs.rmSync(logsPath, { recursive: true, force: true })
	})
})
