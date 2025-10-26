import { describe, it, expect } from 'vitest'
import { isNumber } from './index.js'

describe('isNumber()', () => {
	it('单个判断', () => {
		expect(isNumber(1)).toBe(true)
		expect(isNumber(0b1)).toBe(true)
		expect(isNumber(NaN)).toBe(true)
		expect(isNumber(Infinity)).toBe(true)
		expect(isNumber(-Infinity)).toBe(true)
		expect(isNumber(1n)).toBe(false)
		expect(isNumber('')).toBe(false)
		// @ts-ignore
		expect(isNumber()).toBe(false)
	})

	it('批量判断 isNumber.all()', () => {
		expect(isNumber.all(0, 1, NaN, Infinity, -Infinity)).toBe(true)
		expect(isNumber.all(NaN, Infinity, 1n)).toBe(false)
		expect(isNumber.all()).toBe(false)
	})
})
