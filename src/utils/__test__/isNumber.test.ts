import { test, expect } from 'vitest'
import { isNumber } from '../index.js'

test('isNumber()', () => {
	expect(isNumber(1), 'number').toBe(true)
	expect(isNumber(Infinity), 'number').toBe(true)
	expect(isNumber(-Infinity), 'number').toBe(true)
	expect(isNumber(NaN), 'number').toBe(true)
	expect(isNumber('a'), 'string').toBe(false)
	expect(isNumber(true), 'boolean').toBe(false)
	expect(isNumber(Symbol()), 'symbol').toBe(false)
	expect(isNumber(BigInt(10)), 'bigint').toBe(false)
	expect(isNumber(undefined), 'undefined').toBe(false)
	expect(isNumber(null), 'null').toBe(false)
	expect(
		isNumber(() => {}),
		'function'
	).toBe(false)
	expect(isNumber([]), 'array').toBe(false)
	expect(isNumber({}), 'object').toBe(false)
	expect(isNumber(new Date()), 'date').toBe(false)
})

test('isNumber.all()', () => {
	expect(isNumber.all(1, 2)).toBe(true)
	expect(isNumber.all(NaN, 2, Infinity, -Infinity)).toBe(true)
	expect(isNumber.all(null, 1)).toBe(false)
	expect(isNumber.all(null)).toBe(false)
})
