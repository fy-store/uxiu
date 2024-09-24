import { test, expect } from 'vitest'
import { isSymbol } from '../index.js'

test('isSymbol()', () => {
	expect(isSymbol(0), 'number').toBe(false)
	expect(isSymbol(''), 'string').toBe(false)
	expect(isSymbol(true), 'boolean').toBe(false)
	expect(isSymbol(Symbol()), 'symbol').toBe(true)
	expect(isSymbol(BigInt(10)), 'bigint').toBe(false)
	expect(isSymbol(undefined), 'undefined').toBe(false)
	expect(isSymbol(null), 'null').toBe(false)
	expect(
		isSymbol(() => {}),
		'function'
	).toBe(false)
	expect(isSymbol([]), 'array').toBe(false)
	expect(isSymbol({}), 'object').toBe(false)
	expect(isSymbol(new Date()), 'date').toBe(false)
})

test('isSymbol.all()', () => {
	expect(isSymbol.all(Symbol(), null)).toBe(false)
	expect(isSymbol.all(Symbol(), Symbol())).toBe(true)
})
