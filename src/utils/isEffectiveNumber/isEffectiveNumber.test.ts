import { describe, it, expect } from 'vitest'
import { isEffectiveNumber } from './index.js'

describe('isEffectiveNumber()', () => {
	it('单个判断', () => {
		expect(isEffectiveNumber(1)).toBe(true)
		expect(isEffectiveNumber(0)).toBe(true)
		expect(isEffectiveNumber(1n)).toBe(false)
		expect(isEffectiveNumber(NaN)).toBe(false)
		expect(isEffectiveNumber(Infinity)).toBe(false)
		expect(isEffectiveNumber(-Infinity)).toBe(false)
		// @ts-ignore
		expect(isEffectiveNumber()).toBe(false)
	})

	it('批量判断 isEffectiveNumber.all()', () => {
		expect(isEffectiveNumber.all(1, 0, -1)).toBe(true)
		expect(isEffectiveNumber.all(1, 2, Infinity)).toBe(false)
		expect(isEffectiveNumber.all()).toBe(false)
	})
})
