import { describe, it, expect } from 'vitest'
import { omit } from './index.js'

describe('omit()', () => {
	it('不改变原对象', () => {
		const obj = { a: 1, b: 2, c: 3 }
		expect(omit(obj, ['a'])).toEqual({ b: 2, c: 3 })
		// @ts-ignore
		expect(omit(obj, ['a', 'b', 'c', 'd'])).toEqual({})
	})

	it('改变原对象', () => {
		const obj = { a: 1, b: 2, c: 3 }
		expect(omit.effect(obj, ['a'])).toEqual({ b: 2, c: 3 })
		expect(obj).toEqual({ b: 2, c: 3 })
		// @ts-ignore
		expect(omit.effect(obj, ['a', 'b', 'c', 'd'])).toEqual({})
		expect(obj).toEqual({})
	})
})
