import { test, expect } from 'vitest'
import { isBoolean } from '../index.js'

test('isBoolean()', () => {
	expect(isBoolean(0), 'number').toBe(false)
	expect(isBoolean(''), 'string').toBe(false)
	expect(isBoolean(true), 'boolean').toBe(true)
	expect(isBoolean(false), 'boolean').toBe(true)
	expect(isBoolean(Symbol()), 'symbol').toBe(false)
	expect(isBoolean(BigInt(10)), 'bigint').toBe(false)
	expect(isBoolean(undefined), 'undefined').toBe(false)
	expect(isBoolean(null), 'null').toBe(false)
	expect(
		isBoolean(() => {}),
		'function'
	).toBe(false)
	expect(isBoolean([]), 'array').toBe(false)
	expect(isBoolean({}), 'object').toBe(false)
	expect(isBoolean(new Date()), 'date').toBe(false)
})

test('isBoolean.all()', () => {
	expect(isBoolean.all(true, null)).toBe(false)
	expect(isBoolean.all(false)).toBe(true)
	expect(isBoolean.all(true)).toBe(true)
	expect(isBoolean.all(true, false)).toBe(true)
})
