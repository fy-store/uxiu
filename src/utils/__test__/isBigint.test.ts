import { test, expect } from 'vitest'
import { isBigint } from '../index.js'

test('isBigint()', () => {
	expect(isBigint(0), 'number').toBe(false)
	expect(isBigint(''), 'string').toBe(false)
	expect(isBigint(true), 'boolean').toBe(false)
	expect(isBigint(Symbol()), 'symbol').toBe(false)
	expect(isBigint(BigInt(10)), 'bigint').toBe(true)
	expect(isBigint(undefined), 'undefined').toBe(false)
	expect(isBigint(null), 'null').toBe(false)
	expect(
		isBigint(() => {}),
		'function'
	).toBe(false)
	expect(isBigint([]), 'array').toBe(false)
	expect(isBigint({}), 'object').toBe(false)
	expect(isBigint(new Date()), 'date').toBe(false)
})

test('isBigint.all()', () => {
	expect(isBigint.all(BigInt(1), 1)).toBe(false)
	expect(isBigint.all(BigInt(1), BigInt(1))).toBe(true)
})
