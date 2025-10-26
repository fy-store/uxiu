import { describe, it, expect } from 'vitest'
import { isNull } from './index.js'

describe('isNull()', () => {
	it('单个判断', () => {
		expect(isNull(null)).toBe(true)
		expect(isNull(undefined)).toBe(false)
		// @ts-ignore
		expect(isNull()).toBe(false)
	})

	it('批量判断 isNull.all()', () => {
		expect(isNull.all(null, null)).toBe(true)
		expect(isNull.all(null, undefined)).toBe(false)
		expect(isNull.all()).toBe(false)
	})
})
