import { describe, it, expect } from 'vitest'
import { isSymbol } from './index.js'

describe('isSymbol()', () => {
	it('单个判断', () => {
		expect(isSymbol(Symbol())).toBe(true)
		expect(isSymbol({})).toBe(false)
		expect(isSymbol(0)).toBe(false)
		// @ts-ignore
		expect(isSymbol()).toBe(false)
	})

	it('批量判断 isSymbol.all()', () => {
		expect(isSymbol.all(Symbol(), Symbol())).toBe(true)
		expect(isSymbol.all(Symbol(), Symbol(), null)).toBe(false)
		expect(isSymbol.all()).toBe(false)
	})
})
