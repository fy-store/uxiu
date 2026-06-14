import { afterEach, describe, it, expect, vi } from 'vitest'
import { everydayTask } from './index.js'

describe('everydayTask()', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('基础使用', async () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0))
		let executed = false
		const clearTask = everydayTask(
			() => {
				executed = true
			},
			{
				hour: 12,
				minute: 0,
				second: 1
			}
		)

		await vi.advanceTimersByTimeAsync(1000)
		expect(executed).toBe(true)
		clearTask()
	})

	it('如果为过去时间则立即执行一次', async () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 1))
		let executed = false
		const clearTask = everydayTask(
			() => {
				executed = true
			},
			{
				hour: 12,
				minute: 0,
				second: 0,
				exceedImmediatelyExecute: true
			}
		)

		await vi.advanceTimersByTimeAsync(0)
		expect(executed).toBe(true)
		clearTask()
	})

	it('任务内部执行清除', async () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 1))
		let executed = false
		everydayTask(
			(clearTask) => {
				executed = true
				clearTask()
			},
			{
				hour: 12,
				minute: 0,
				second: 0,
				exceedImmediatelyExecute: true
			}
		)

		await vi.advanceTimersByTimeAsync(0)
		expect(executed).toBe(true)
	})
})
