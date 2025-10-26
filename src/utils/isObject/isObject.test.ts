import { describe, it, expect } from 'vitest'
import { isObject } from './index.js'

describe('isObject()', () => {
	it('单个判断', () => {
		expect(isObject({})).toBe(true)
		expect(isObject(new Date())).toBe(true)
		expect(isObject([])).toBe(true)
		expect(isObject(function () {})).toBe(false)
		// @ts-ignore
		expect(isObject()).toBe(false)
	})

	it('批量判断 isObject.all()', () => {
		expect(isObject.all({}, new RegExp('1'), [])).toBe(true)
		expect(isObject.all({}, new RegExp('1'), [], function () {})).toBe(false)
		expect(isObject.all()).toBe(false)
	})
})
