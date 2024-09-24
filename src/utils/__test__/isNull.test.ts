import { test, expect } from 'vitest'
import { isNull } from '../index.js'

test('isNull()', () => {
	expect(isNull(1), 'number').toBe(false)
	expect(isNull('a'), 'string').toBe(false)
	expect(isNull(true), 'boolean').toBe(false)
	expect(isNull(Symbol()), 'symbol').toBe(false)
	expect(isNull(BigInt(10)), 'bigint').toBe(false)
	expect(isNull(undefined), 'undefined').toBe(false)
	expect(isNull(null), 'null').toBe(true)
	expect(
		isNull(() => {}),
		'function'
	).toBe(false)
	expect(isNull([]), 'array').toBe(false)
	expect(isNull({}), 'object').toBe(false)
	expect(isNull(new Date()), 'date').toBe(false)
})

test('isNull.all()', () => {
	expect(isNull.all(1, 2)).toBe(false)
	expect(isNull.all(null, 1)).toBe(false)
	expect(isNull.all(null)).toBe(true)
	expect(isNull.all(undefined, null, 0)).toBe(false)
})
