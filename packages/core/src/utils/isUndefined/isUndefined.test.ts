import { describe, it, expect } from 'vitest'
import { isUndefined } from './index.js'

describe('isUndefined()', () => {
	it('单个判断', () => {
		expect(isUndefined(undefined)).toBe(true)
		expect(isUndefined(null)).toBe(false)
		expect(isUndefined(0)).toBe(false)
		// @ts-ignore
		expect(isUndefined()).toBe(true)
	})

	it('批量判断 isUndefined.all()', () => {
		expect(isUndefined.all(undefined, undefined)).toBe(true)
		expect(isUndefined.all(undefined, undefined, null)).toBe(false)
		expect(isUndefined.all()).toBe(true)
	})
})
