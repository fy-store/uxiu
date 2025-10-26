import { describe, it, expect } from 'vitest'
import { convertProps } from './index.js'

describe('convertProps()', () => {
	it('不影响原数据使用', () => {
		const obj = { a: 1, b: 2, c: 3 }
		const newObj = convertProps(obj, {
			a: 'a',
			b: { value: 2 },
			c(v) {
				return v + 1
			}
		})
		expect(newObj).toEqual({ a: 'a', b: { value: 2 }, c: 4 })
	})

	it('影响原数据使用', () => {
		const obj = { a: 1, b: 2, c: 3 }
		const newObj = convertProps.effect(obj, {
			a: 'a',
			b: { value: 2 },
			c(v) {
				return v + 1
			}
		})
		expect(newObj).toEqual({ a: 'a', b: { value: 2 }, c: 4 })
		expect(obj).toEqual({ a: 'a', b: { value: 2 }, c: 4 })
		expect(newObj).toBe(obj)
	})
})
