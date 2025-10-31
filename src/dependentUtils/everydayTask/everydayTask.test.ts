import { describe, it, expect } from 'vitest'
import { everydayTask } from './index.js'
import { sleep } from '../sleep/index.js'

describe('everydayTask()', () => {
	it('基础使用', async () => {
		const currentTime = new Date()
		let executed = false
		const clearTask = everydayTask(
			() => {
				executed = true
			},
			{
				hour: currentTime.getHours(),
				minute: currentTime.getMinutes(),
				second: currentTime.getSeconds() + 1
			}
		)

		await sleep(1500)
		expect(executed).toBe(true)
		clearTask()
	})

	it('如果为过去时间则立即执行一次', async () => {
		const currentTime = new Date()
		let executed = false
		const clearTask = everydayTask(
			() => {
				executed = true
			},
			{
				hour: currentTime.getHours(),
				minute: currentTime.getMinutes(),
				second: currentTime.getSeconds() - 1,
				exceedImmediatelyExecute: true
			}
		)

		await sleep(5)
		expect(executed).toBe(true)
		clearTask()
	})

	it('任务内部执行清除', async () => {
		const currentTime = new Date()
		let executed = false
		everydayTask(
			(clearTask) => {
				executed = true
				clearTask()
			},
			{
				hour: currentTime.getHours(),
				minute: currentTime.getMinutes(),
				second: currentTime.getSeconds() - 1,
				exceedImmediatelyExecute: true
			}
		)

		await sleep(5)
		expect(executed).toBe(true)
	})
})
