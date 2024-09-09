import { test, expect } from 'vitest'
import { isObject } from '../index.js'

test('isObject()', () => {
	expect(isObject(1), 'number').toBe(false)
	expect(isObject('a'), 'string').toBe(false)
	expect(isObject(true), 'boolean').toBe(false)
	expect(isObject(Symbol()), 'symbol').toBe(false)
	expect(isObject(BigInt(10)), 'bigint').toBe(false)
	expect(isObject(undefined), 'undefined').toBe(false)
	expect(isObject(null), 'null').toBe(false)
	expect(
		isObject(() => {}),
		'function'
	).toBe(false)
	expect(isObject([]), 'array').toBe(false)
	expect(isObject({}), 'object').toBe(true)
	expect(isObject(new Date()), 'date').toBe(true)
})

test('isObject.all()', () => {
	expect(isObject.all(1, 2)).toBe(false)
	expect(isObject.all({}, 1)).toBe(false)
	expect(isObject.all({})).toBe(true)
	expect(isObject.all({}, {})).toBe(true)
	expect(isObject.all({}, new Date())).toBe(true)
})
