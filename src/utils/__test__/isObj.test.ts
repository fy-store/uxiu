import { test, expect } from 'vitest'
import { isObj } from '../index.js'

test('isObject()', () => {
	expect(isObj(1), 'number').toBe(false)
	expect(isObj('a'), 'string').toBe(false)
	expect(isObj(true), 'boolean').toBe(false)
	expect(isObj(Symbol()), 'symbol').toBe(false)
	expect(isObj(BigInt(10)), 'bigint').toBe(false)
	expect(isObj(undefined), 'undefined').toBe(false)
	expect(isObj(null), 'null').toBe(false)
	expect(
		isObj(() => {}),
		'function'
	).toBe(false)
	expect(isObj([]), 'array').toBe(false)
	expect(isObj({}), 'object').toBe(true)
	expect(isObj(new Date()), 'date').toBe(true)
})

test('isObject.all()', () => {
	expect(isObj.all(1, 2)).toBe(false)
	expect(isObj.all({}, 1)).toBe(false)
	expect(isObj.all({})).toBe(true)
	expect(isObj.all({}, {})).toBe(true)
	expect(isObj.all({}, new Date())).toBe(true)
})
