import { describe, it, expect } from 'vitest'
import { isReferenceValue } from './index.js'

describe('isReferenceValue()', () => {
	it('单个判断', () => {
		expect(isReferenceValue({})).toBe(true)
		expect(isReferenceValue([])).toBe(true)
		expect(isReferenceValue(function () {})).toBe(true)
		expect(isReferenceValue(0)).toBe(false)
		expect(isReferenceValue(null)).toBe(false)
		// @ts-ignore
		expect(isReferenceValue()).toBe(false)
	})

	it('批量判断 isReferenceValue.all()', () => {
		expect(isReferenceValue.all({}, [], function () {})).toBe(true)
		expect(isReferenceValue.all({}, [], function () {}, null)).toBe(false)
		expect(isReferenceValue.all()).toBe(false)
	})
})
