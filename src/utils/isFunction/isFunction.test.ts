import { describe, it, expect } from 'vitest'
import { isFunction } from './index.js'

describe('isFunction()', () => {
	it('单个判断', () => {
		expect(isFunction(function () {})).toBe(true)
		expect(isFunction({})).toBe(false)
		// @ts-ignore
		expect(isFunction()).toBe(false)
	})

	it('批量判断 isFunction.all()', () => {
		expect(
			isFunction.all(
				function () {},
				() => {}
			)
		).toBe(true)
		expect(isFunction.all(() => {}, [])).toBe(false)
		expect(isFunction.all()).toBe(false)
	})
})
