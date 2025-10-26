import { describe, it, expect } from 'vitest'
import { isBigint } from './index.js'

describe('isBigint()', () => {
	it('单个判断', () => {
		expect(isBigint(1n)).toBe(true)
		expect(isBigint(1)).toBe(false)
		expect(isBigint('1')).toBe(false)
		// @ts-ignore
		expect(isBigint()).toBe(false)
	})

	it('批量判断 isBigint.all()', () => {
		expect(isBigint.all(1n, 2n, 3n)).toBe(true)
		expect(isBigint.all(1n, 2n, 3)).toBe(false)
		expect(isBigint.all()).toBe(false)
	})
})
