import { describe, it, expect } from 'vitest'
import { createApp } from './index.js'

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
})
