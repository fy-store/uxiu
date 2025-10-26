import { describe, it, expect } from 'vitest'
import { isString } from './index.js'

describe('isString()', () => {
	it('单个判断', () => {
		expect(isString('')).toBe(true)
		expect(isString(' ')).toBe(true)
		expect(isString(0)).toBe(false)
		expect(isString(null)).toBe(false)
		// @ts-ignore
		expect(isString()).toBe(false)
	})

	it('批量判断 isString.all()', () => {
		expect(isString.all('', ' ')).toBe(true)
		expect(isString.all('', ' ', null)).toBe(false)
		expect(isString.all()).toBe(false)
	})
})
