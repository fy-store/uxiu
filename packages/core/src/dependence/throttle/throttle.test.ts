import { describe, it, expect } from 'vitest'
import { throttle } from './index.js'
import { sleep } from '../sleep/index.js'

describe('throttle()', () => {
	it('默认模式会立即触发且在窗口期内抑制后续调用', async () => {
		const calls: string[] = []
		const handler = throttle((value: string) => {
			calls.push(value)
		}, 40)

		handler('first')
		handler('second')
		handler('third')

		expect(calls).toEqual(['first'])

		await sleep(80)
		handler('fourth')

		expect(calls).toEqual(['first', 'fourth'])
	})

	it('trailing 模式可以在窗口结束时补一次调用', async () => {
		const calls: string[] = []
		const handler = throttle((value: string) => {
			calls.push(value)
		}, 40, { immediately: false, trailing: true })

		handler('a')
		handler('b')
		handler('c')

		expect(calls).toEqual([])

		await sleep(80)

		expect(calls).toHaveLength(1)
	})

	it('cancel 可以取消等待中的 trailing 调用', async () => {
		const calls: string[] = []
		const handler = throttle((value: string) => {
			calls.push(value)
		}, 40, { immediately: false, trailing: true })

		handler('a')
		handler.cancel()

		await sleep(80)

		expect(calls).toEqual([])
	})
})
