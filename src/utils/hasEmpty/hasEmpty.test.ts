import { describe, it, expect } from 'vitest'
import { hasEmpty } from './index.js'

describe('hasEmpty()', () => {
	it('验证对象是否存在空值', () => {
		expect(hasEmpty({ a: 1, b: null, c: 3 })).toBe(true)
		expect(hasEmpty({ a: 1, b: undefined, c: 3 })).toBe(true)
		expect(hasEmpty({ a: 1, b: false, c: 3 })).toBe(false)
	})

	it('验证数组是否存在空值', () => {
		expect(hasEmpty([1, 2, null, 4])).toBe(true)
		expect(hasEmpty([1, 2, undefined, 4])).toBe(true)
		expect(hasEmpty([1, 2, false, 4])).toBe(false)
	})

	it('验证非引用类型抛出异常', () => {
		expect(() => hasEmpty(123 as any)).toThrow(TypeError)
		expect(() => hasEmpty('string' as any)).toThrow(TypeError)
		expect(() => hasEmpty(true as any)).toThrow(TypeError)
		expect(() => hasEmpty(null as any)).toThrow(TypeError)
		expect(() => hasEmpty(undefined as any)).toThrow(TypeError)
	})

	it('验证函数是否存在空值', () => {
		function fn() {}
		fn.a = null
		expect(hasEmpty(fn)).toBe(true)
		expect(hasEmpty(() => {})).toBe(false)
	})
})
