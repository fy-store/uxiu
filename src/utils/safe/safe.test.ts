import { describe, it, expect } from 'vitest'
import { safe } from './index.js'
import { sleep } from '../../dependentUtils/index.js'

describe('safe()', () => {
	it('同步函数', () => {
		const [err1, res1] = safe(() => {
			return 1
		})
		expect(err1).toBeUndefined()
		expect(res1).toBe(1)

		const [err2, res2] = safe(() => {
			throw new Error('同步错误')
			return
		})
		expect(err2).toBeInstanceOf(Error)
		expect(res2).toBeUndefined()
	})

	it('异步函数', async () => {
		const [err1, res1] = await safe(async () => {
			return 1
		})
		expect(err1).toBeUndefined()
		expect(res1).toBe(1)

		const [err2, res2] = await safe(async () => {
			await sleep(100)
			throw new Error('异步错误')
		})
		expect(err2).toBeInstanceOf(Error)
		expect(res2).toBeUndefined()
	})
})
