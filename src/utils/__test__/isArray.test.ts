import { test, expect } from 'vitest'
import { isArray } from '../index.js'

test('isArray()', () => {
	expect(isArray(1), 'number').toBe(false)
	expect(isArray('a'), 'string').toBe(false)
	expect(isArray(true), 'boolean').toBe(false)
	expect(isArray(Symbol()), 'symbol').toBe(false)
	expect(isArray(BigInt(10)), 'bigint').toBe(false)
	expect(isArray(undefined), 'undefined').toBe(false)
	expect(isArray(null), 'null').toBe(false)
	expect(
		isArray(() => {}),
		'function'
	).toBe(false)
	expect(isArray([]), 'array').toBe(true)
	expect(isArray({}), 'object').toBe(false)
	expect(isArray(new Date()), 'date').toBe(false)
})

test('isArray.all()', () => {
	expect(isArray.all(1, 2)).toBe(false)
	expect(isArray.all([], 1)).toBe(false)
	expect(isArray.all([])).toBe(true)
	expect(isArray.all([], [{}])).toBe(true)
})
