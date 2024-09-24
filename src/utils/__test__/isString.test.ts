import { test, expect } from 'vitest'
import { isString } from '../index.js'

test('isString()', () => {
	expect(isString(1), 'number').toBe(false)
	expect(isString('a'), 'string').toBe(true)
	expect(isString('1'), 'string').toBe(true)
	expect(isString('0'), 'string').toBe(true)
	expect(isString(''), 'string').toBe(true)
	expect(isString('  '), 'string').toBe(true)
	expect(isString(true), 'boolean').toBe(false)
	expect(isString(Symbol()), 'symbol').toBe(false)
	expect(isString(BigInt(10)), 'bigint').toBe(false)
	expect(isString(undefined), 'undefined').toBe(false)
	expect(isString(null), 'null').toBe(false)
	expect(
		isString(() => {}),
		'function'
	).toBe(false)
	expect(isString([]), 'array').toBe(false)
	expect(isString({}), 'object').toBe(false)
	expect(isString(new Date()), 'date').toBe(false)
})

test('isString.all()', () => {
	expect(isString.all('1', '2')).toBe(true)
	expect(isString.all(null, '1')).toBe(false)
	expect(isString.all(null)).toBe(false)
})
