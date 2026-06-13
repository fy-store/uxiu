import { describe, it, expect } from 'vitest'
import { isOriginValue } from './index.js'

describe('isOriginValue()', () => {
	it('单个判断', () => {
		expect(isOriginValue(0)).toBe(true)
		expect(isOriginValue(undefined)).toBe(true)
		expect(isOriginValue(null)).toBe(true)
		expect(isOriginValue(1n)).toBe(true)
		expect(isOriginValue(Symbol())).toBe(true)
		expect(isOriginValue(true)).toBe(true)
		expect(isOriginValue('')).toBe(true)
		expect(isOriginValue({})).toBe(false)
		expect(isOriginValue([])).toBe(false)
		expect(isOriginValue(function () {})).toBe(false)
		// @ts-ignore
		expect(isOriginValue()).toBe(true)
	})

	it('批量判断 isOriginValue.all()', () => {
		expect(isOriginValue.all(1, 1n, '')).toBe(true)
		expect(isOriginValue.all(1, 1n, '', [])).toBe(false)
		expect(isOriginValue.all()).toBe(true)
	})
})
