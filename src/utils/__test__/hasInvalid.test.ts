import { test, expect } from 'vitest'
import { hasInvalid } from '../index.js'

test('hasInvalid()', () => {
	expect(hasInvalid({})).toBe(false)
	expect(hasInvalid({ a: undefined })).toBe(true)
	expect(hasInvalid({ b: null })).toBe(true)
	expect(hasInvalid({ c: 0 })).toBe(false)
	expect(hasInvalid({ d: -0 })).toBe(false)
})

test('hasInvalid() 忽略', () => {
	expect(hasInvalid({ a: undefined }, ['a'])).toBe(false)
})

test('hasInvalid() 配置', () => {
	expect(hasInvalid({ a: -0 }, undefined, { '-0': true })).toBe(true)
	expect(hasInvalid({ a: 123 }, undefined, { '123': true })).toBe(true)
})
