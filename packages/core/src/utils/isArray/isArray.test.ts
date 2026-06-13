import { describe, it, expect } from 'vitest'
import { isArray } from './index.js'

describe('isArray()', () => {
	it('单个判断', () => {
		expect(isArray([])).toBe(true)
		expect(isArray({})).toBe(false)
		expect(isArray('string')).toBe(false)
		// @ts-ignore
		expect(isArray()).toBe(false)
	})

	it('批量判断 isArray.all()', () => {
		expect(isArray.all([], [1, 2], ['a'])).toBe(true)
		expect(isArray.all([], {}, 'string')).toBe(false)
		expect(isArray.all()).toBe(false)
	})
})
