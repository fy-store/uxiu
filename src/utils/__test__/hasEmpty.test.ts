import { test, expect } from 'vitest'
import { hasEmpty } from '../index.js'

test('hasEmpty()', () => {
	expect(hasEmpty({})).toBe(false)
	expect(hasEmpty({ a: undefined })).toBe(true)
	expect(hasEmpty({ b: null })).toBe(true)
})
