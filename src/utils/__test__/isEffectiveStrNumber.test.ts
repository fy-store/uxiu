import { describe, test, expect } from 'vitest'
import { isEffectiveStrNumber } from '../isEffectiveStrNumber/index.js'

describe('isEffectiveStrNumber()', () => {
	test('bigint', () => {
		// @ts-expect-error
		expect(isEffectiveStrNumber(BigInt(1))).toBe(false)
	})

	test('number', () => {
		expect(isEffectiveStrNumber(1)).toBe(true)
		expect(isEffectiveStrNumber(1.1)).toBe(true)
		expect(isEffectiveStrNumber(NaN)).toBe(false)
		expect(isEffectiveStrNumber(Infinity)).toBe(false)
		expect(isEffectiveStrNumber(-Infinity)).toBe(false)
		expect(isEffectiveStrNumber(0x12)).toBe(true)
		expect(isEffectiveStrNumber(1.23e10)).toBe(true)
	})

	test('string', () => {
		expect(isEffectiveStrNumber('1')).toBe(true)
		expect(isEffectiveStrNumber('1.1')).toBe(true)
		expect(isEffectiveStrNumber('0.1')).toBe(true)
		expect(isEffectiveStrNumber('0.0')).toBe(true)
		expect(isEffectiveStrNumber('0')).toBe(true)
		expect(isEffectiveStrNumber('+0')).toBe(true)
		expect(isEffectiveStrNumber('-0')).toBe(true)
		expect(isEffectiveStrNumber(' 0')).toBe(false)
		expect(isEffectiveStrNumber('0 ')).toBe(false)
		expect(isEffectiveStrNumber('0.')).toBe(false)
		expect(isEffectiveStrNumber('')).toBe(false)
		expect(isEffectiveStrNumber('.0')).toBe(false)
		expect(isEffectiveStrNumber('.')).toBe(false)
		expect(isEffectiveStrNumber('0.')).toBe(false)
		expect(isEffectiveStrNumber('00')).toBe(false)
		expect(isEffectiveStrNumber(' 0 ')).toBe(false)
		expect(isEffectiveStrNumber('0n')).toBe(false)
        expect(isEffectiveStrNumber('0x12')).toBe(false)
		expect(isEffectiveStrNumber('1.23e10')).toBe(false)
	})
})
