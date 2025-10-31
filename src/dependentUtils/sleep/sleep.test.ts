import { describe, it, expect } from 'vitest'
import { sleep } from './index.js'

describe('sleep()', () => {
	it('异步睡眠', async () => {
		const start = Date.now()
		await sleep(100)
		const end = Date.now()
		expect(end - start).toBeGreaterThanOrEqual(100)
	})

	it('同步睡眠', () => {
		const start = Date.now()
		sleep.sync(100)
		const end = Date.now()
		expect(end - start).toBeGreaterThanOrEqual(100)
	})
})
