import { describe, it, expect } from 'vitest'
import { isEffectiveStrNumber } from './index.js'

describe('isEffectiveStrNumber()', () => {
	it('数字判断', () => {
		expect(isEffectiveStrNumber(1)).toBe(true)
		expect(isEffectiveStrNumber(0)).toBe(true)
		expect(isEffectiveStrNumber(Infinity)).toBe(false)
		expect(isEffectiveStrNumber(NaN)).toBe(false)
	})

	it('合法数字字符串判断', () => {
		expect(isEffectiveStrNumber('1')).toBe(true)
		expect(isEffectiveStrNumber('+1')).toBe(true)
		expect(isEffectiveStrNumber('-1')).toBe(true)
		expect(isEffectiveStrNumber('10')).toBe(true)
		expect(isEffectiveStrNumber('0')).toBe(true)
		expect(isEffectiveStrNumber('1.0000')).toBe(true)
		expect(isEffectiveStrNumber('0.1000')).toBe(true)
	})

	it('非法数字字符串判断', () => {
		expect(isEffectiveStrNumber('')).toBe(false)
		expect(isEffectiveStrNumber('abc')).toBe(false)
		expect(isEffectiveStrNumber('0-0')).toBe(false)
		expect(isEffectiveStrNumber('0.')).toBe(false)
		expect(isEffectiveStrNumber('.1')).toBe(false)
		expect(isEffectiveStrNumber('00')).toBe(false)
		expect(isEffectiveStrNumber('01')).toBe(false)
		expect(isEffectiveStrNumber('00.')).toBe(false)
		expect(isEffectiveStrNumber('Infinity')).toBe(false)
		expect(isEffectiveStrNumber('NaN')).toBe(false)
		expect(isEffectiveStrNumber('0b1')).toBe(false)
	})
})
