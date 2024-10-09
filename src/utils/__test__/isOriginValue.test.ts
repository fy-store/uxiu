import { test, expect } from 'vitest'
import { isOriginValue } from '../index.js'

test('isOriginValue()', () => {
	expect(isOriginValue(1), 'number').toBe(true)
	expect(isOriginValue('a'), 'string').toBe(true)
	expect(isOriginValue(true), 'boolean').toBe(true)
	expect(isOriginValue(Symbol()), 'symbol').toBe(true)
	expect(isOriginValue(BigInt(10)), 'bigint').toBe(true)
	expect(isOriginValue(undefined), 'undefined').toBe(true)
	expect(isOriginValue(null), 'null').toBe(true)
	expect(
		isOriginValue(() => {}),
		'function'
	).toBe(false)
	expect(isOriginValue([]), 'array').toBe(false)
	expect(isOriginValue({}), 'object').toBe(false)
	expect(isOriginValue(new Date()), 'date').toBe(false)
})

test('isOriginValue.all()', () => {
	expect(isOriginValue.all(1, 2)).toBe(true)
	expect(isOriginValue.all(null, 1)).toBe(true)
	expect(isOriginValue.all(null)).toBe(true)
	expect(isOriginValue.all(undefined, null, 0)).toBe(true)
	expect(isOriginValue.all(undefined, null, 0, {})).toBe(false)
})
