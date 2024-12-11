import { test, expect } from 'vitest'
import { isEmpty } from '../index.js'

test('isEmpty()', () => {
	expect(isEmpty(0)).toBe(false)
	// @ts-ignore
	expect(isEmpty()).toBe(true)
	expect(isEmpty(undefined)).toBe(true)
	expect(isEmpty(null)).toBe(true)
	expect(isEmpty('')).toBe(false)
	expect(isEmpty(1)).toBe(false)
})

test('isEmpty.all()', () => {
	expect(isEmpty.all(null, undefined)).toBe(true)
	expect(isEmpty.all()).toBe(true)
	expect(isEmpty.all(null, '')).toBe(false)
})
