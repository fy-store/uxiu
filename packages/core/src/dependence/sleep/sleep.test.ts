import { describe, it, expect } from 'vitest'
import { sleep } from './index.js'

describe('sleep()', () => {
	it('异步睡眠', async () => {
		const start = Date.now()
		await sleep(100)
		const end = Date.now()
		// 定时器存在精度误差, 不保证严格 >= 100, 只校验大致范围
		expect(end - start).toBeGreaterThanOrEqual(90)
		expect(end - start).toBeLessThan(300)
	})

	it('同步睡眠', () => {
		const start = Date.now()
		sleep.sync(100)
		const end = Date.now()
		expect(end - start).toBeGreaterThanOrEqual(100)
	})
})
