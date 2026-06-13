import { describe, it, expect } from 'vitest'
import { hasInvalid } from './index.js'

describe('hasInvalid()', () => {
	it('默认配置 undefined 和 null 和 NaN 和 Infinity 和 -Infinity 视为无效值', () => {
		expect(hasInvalid({ a: undefined, b: 2 })).toBe(true)
		expect(hasInvalid({ a: null, b: 2 })).toBe(true)
		expect(hasInvalid({ a: NaN, b: 2 })).toBe(true)
		expect(hasInvalid({ a: Infinity, b: 2 })).toBe(true)
		expect(hasInvalid({ a: -Infinity, b: 2 })).toBe(true)
		expect(hasInvalid([1, undefined, 3])).toBe(true)
		expect(hasInvalid([1, null, 3])).toBe(true)
		expect(hasInvalid([1, NaN, 3])).toBe(true)
		expect(hasInvalid([1, Infinity, 3])).toBe(true)
		expect(hasInvalid([1, -Infinity, 3])).toBe(true)
	})

	it('自定义验证', () => {
		expect(hasInvalid({ a: undefined }, [], { undefined: false })).toBe(false)
		expect(hasInvalid([undefined], [], { undefined: false })).toBe(false)
		expect(hasInvalid({ a: undefined }, [], { undefined: true })).toBe(true)
		expect(hasInvalid([undefined], [], { undefined: true })).toBe(true)
	})

	it('忽略字段', () => {
		expect(hasInvalid({ a: undefined, b: 2 }, ['a'])).toBe(false)
	})
})
