import { describe, it, expect } from 'vitest'
import { isEmpty } from './index.js'

describe('isEmpty()', () => {
	it('单个判断', () => {
		expect(isEmpty(null)).toBe(true)
		expect(isEmpty(undefined)).toBe(true)
		expect(isEmpty('')).toBe(false)
		expect(isEmpty(1)).toBe(false)
		// @ts-ignore
		expect(isEmpty()).toBe(true)
	})

	it('批量判断 isEmpty.all()', () => {
		expect(isEmpty.all(null, undefined)).toBe(true)
		expect(isEmpty.all(null, 0)).toBe(false)
		expect(isEmpty.all()).toBe(true)
	})
})
