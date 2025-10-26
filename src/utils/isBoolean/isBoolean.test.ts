import { describe, it, expect } from 'vitest'
import { isBoolean } from './index.js'

describe('isBoolean()', () => {
	it('单个判断', () => {
		expect(isBoolean(true)).toBe(true)
		expect(isBoolean(false)).toBe(true)
		expect(isBoolean(1)).toBe(false)
		expect(isBoolean(null)).toBe(false)
		// @ts-ignore
		expect(isBoolean()).toBe(false)
	})

	it('批量判断 isBoolean.all()', () => {
		expect(isBoolean.all(true, false)).toBe(true)
		expect(isBoolean.all(true, false, 0)).toBe(false)
		expect(isBoolean.all()).toBe(false)
	})
})
