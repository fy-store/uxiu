import { test, expect } from 'vitest'
import { omit } from '../index.js'

test('omit()', () => {
	const target = { a: 1, b: 2, c: 3 }
	expect(omit(target, ['a'])).toEqual({ b: 2, c: 3 })
	expect(target).toEqual({ a: 1, b: 2, c: 3 })
})

test('omit.effect()', () => {
	const target = { a: 1, b: 2, c: 3 }
	expect(omit.effect(target, ['a'])).toEqual({ b: 2, c: 3 })
	expect(omit.effect(target, ['a'])).toEqual(target)
	expect(target).toEqual({ b: 2, c: 3 })
})
