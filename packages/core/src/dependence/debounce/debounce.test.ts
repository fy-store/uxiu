import { describe, it, expect } from 'vitest'
import { debounce } from './index.js'
import { sleep } from '../sleep/index.js'

describe('debounce()', () => {
	it('默认模式只执行最后一次调用', async () => {
		const calls: string[] = []
		const handler = debounce((value: string) => {
			calls.push(value)
		}, 40)

		handler('a')
		handler('b')
		handler('c')

		await sleep(80)

		expect(calls).toEqual(['c'])
	})

	it('immediate 模式在窗口期仅触发一次', async () => {
		const calls: string[] = []
		const handler = debounce((value: string) => {
			calls.push(value)
		}, 40, { immediate: true })

		handler('first')
		handler('second')
		handler('third')

		expect(calls).toEqual(['first'])

		await sleep(80)
		handler('fourth')

		expect(calls).toEqual(['first', 'fourth'])
	})

	it('cancel 可以取消等待中的调用', async () => {
		const calls: string[] = []
		const handler = debounce((value: string) => {
			calls.push(value)
		}, 40)

		handler('will-cancel')
		handler.cancel()

		await sleep(80)

		expect(calls).toEqual([])
	})

	it('flush 可以立即执行一次等待中的调用', async () => {
		const calls: string[] = []
		const handler = debounce((value: string) => {
			calls.push(value)
		}, 40)

		handler('pending')
		handler.flush('flushed')

		expect(calls).toEqual(['flushed'])

		await sleep(80)

		expect(calls).toEqual(['flushed'])
	})
})
