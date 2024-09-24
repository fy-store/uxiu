import { test, expect } from 'vitest'
import { isFunction } from '../index.js'

test('isFunction()', () => {
	expect(isFunction(1), 'number').toBe(false)
	expect(isFunction('a'), 'string').toBe(false)
	expect(isFunction(true), 'boolean').toBe(false)
	expect(isFunction(Symbol()), 'symbol').toBe(false)
	expect(isFunction(BigInt(10)), 'bigint').toBe(false)
	expect(isFunction(undefined), 'undefined').toBe(false)
	expect(isFunction(null), 'null').toBe(false)
	expect(
		isFunction(() => {}),
		'function'
	).toBe(true)
	expect(isFunction([]), 'array').toBe(false)
	expect(isFunction({}), 'object').toBe(false)
	expect(isFunction(new Date()), 'date').toBe(false)
})

test('isFunction.all()', () => {
	expect(
		isFunction.all(
			Number,
			Function,
			() => {},
			function () {},
			Date,
			Object
		)
	).toBe(true)
	expect(isFunction.all(null, Number)).toBe(false)
	expect(isFunction.all(null)).toBe(false)
})
