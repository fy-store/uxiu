import { test, expect, describe, vi } from 'vitest'
import { sleep } from '../index.js'

describe('sleep()', () => {
	test('100ms', async () => {
		const startTime = Date.now()
		await sleep(100) // 等待100毫秒
		const endTime = Date.now()
		expect(endTime - startTime).toBeGreaterThanOrEqual(100)
	})

	test('sleep Callback', async () => {
		const mockCallback = vi.fn()
		await sleep(50, mockCallback)
		expect(mockCallback).toHaveBeenCalled()
	})

	test('sync sleep', () => {
		const mockCallback = vi.fn()
		const startTime = Date.now()
		sleep.sync(50, mockCallback)
		const endTime = Date.now()
		expect(endTime - startTime).toBeGreaterThanOrEqual(50)
		expect(mockCallback).toHaveBeenCalled()
	})
})
