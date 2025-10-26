import { describe, it, expect } from 'vitest'
import { isObj } from './index.js'

describe('isObj()', () => {
	it('单个判断', () => {
		expect(isObj({})).toBe(true)
		expect(isObj(new Date())).toBe(true)
		expect(isObj([])).toBe(false)
		expect(isObj(function () {})).toBe(false)
		// @ts-ignore
		expect(isObj()).toBe(false)
	})

	it('批量判断 isObj.all()', () => {
		expect(isObj.all({}, new RegExp('1'))).toBe(true)
		expect(isObj.all({}, new RegExp('1'), [])).toBe(false)
		expect(isObj.all()).toBe(false)
	})
})
