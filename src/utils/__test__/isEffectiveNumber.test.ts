import { test, expect } from 'vitest'
import { isEffectiveNumber } from '../index.js'

test('isEffectiveNumber()', () => {
	expect(isEffectiveNumber(0)).toBe(true)
	expect(isEffectiveNumber(1)).toBe(true)
	expect(isEffectiveNumber(0.1)).toBe(true)
	expect(isEffectiveNumber(NaN)).toBe(false)
	expect(isEffectiveNumber(Infinity)).toBe(false)
	expect(isEffectiveNumber(-Infinity)).toBe(false)
	expect(isEffectiveNumber(null)).toBe(false)
	expect(isEffectiveNumber(undefined)).toBe(false)
})

test('isEffectiveNumber.all()', () => {
	expect(isEffectiveNumber.all(0)).toBe(true)
	expect(isEffectiveNumber.all(0, 1)).toBe(true)
	expect(isEffectiveNumber.all(0, NaN)).toBe(false)
})
