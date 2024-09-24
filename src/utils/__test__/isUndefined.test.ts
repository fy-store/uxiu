import { test, expect } from 'vitest'
import { isUndefined } from '../index.js'

test('isUndefined()', () => {
	expect(isUndefined(0), 'number').toBe(false)
	expect(isUndefined(''), 'string').toBe(false)
	expect(isUndefined(true), 'boolean').toBe(false)
	expect(isUndefined(Symbol()), 'symbol').toBe(false)
	expect(isUndefined(BigInt(10)), 'bigint').toBe(false)
	expect(isUndefined(undefined), 'undefined').toBe(true)
	// @ts-ignore
	expect(isUndefined(), 'undefined').toBe(true)
	expect(isUndefined(null), 'null').toBe(false)
	expect(
		isUndefined(() => {}),
		'function'
	).toBe(false)
	expect(isUndefined([]), 'array').toBe(false)
	expect(isUndefined({}), 'object').toBe(false)
	expect(isUndefined(new Date()), 'date').toBe(false)
})

test('isUndefined.all()', () => {
	expect(isUndefined.all(undefined, null)).toBe(false)
	// @ts-ignore
	expect(isUndefined.all(), 'undefined').toBe(true)
	expect(isUndefined.all(undefined)).toBe(true)
})
