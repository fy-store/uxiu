import { test, expect } from 'vitest'
import { isReferenceValue } from '../index.js'

test('isReferenceValue()', () => {
	expect(isReferenceValue(1), 'number').toBe(false)
	expect(isReferenceValue('a'), 'string').toBe(false)
	expect(isReferenceValue(true), 'boolean').toBe(false)
	expect(isReferenceValue(Symbol()), 'symbol').toBe(false)
	expect(isReferenceValue(BigInt(10)), 'bigint').toBe(false)
	expect(isReferenceValue(undefined), 'undefined').toBe(false)
	expect(isReferenceValue(null), 'null').toBe(false)
	expect(
		isReferenceValue(() => {}),
		'function'
	).toBe(true)
	expect(isReferenceValue([]), 'array').toBe(true)
	expect(isReferenceValue({}), 'object').toBe(true)
	expect(isReferenceValue(new Date()), 'date').toBe(true)
})

test('isReferenceValue.all()', () => {
	expect(isReferenceValue.all(1, 2)).toBe(false)
	expect(isReferenceValue.all(null, 1)).toBe(false)
	expect(isReferenceValue.all(null)).toBe(false)
	expect(isReferenceValue.all(undefined, null, 0)).toBe(false)
	expect(isReferenceValue.all(Date, {}, [])).toBe(true)
})
