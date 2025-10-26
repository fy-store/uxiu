import { describe, it, expect } from 'vitest'
import { extract } from './index.js'

describe('extract()', () => {
	it('提取对象指定字段', () => {
		const obj = { a: 1, b: 2, c: 3 }
		const result = { a: 1, c: 3 }
		expect(extract(obj, ['a', 'c'])).toEqual(result)
	})

	it('提取对象指定字段, 目标不存在写入 undefined', () => {
		type Obj = { a: number; b: number; c: number; d?: number }
		const obj: Obj = { a: 1, b: 2, c: 3 }
		const result = { a: 1, d: undefined }
		expect(extract(obj, ['a', 'd'])).toEqual(result)
	})

	it('提取对象指定字段, 目标不存在不允许写入 undefined', () => {
		type Obj = { a: number; b: number; c: number; d?: number }
		const obj: Obj = { a: 1, b: 2, c: 3 }
		const result = { a: 1 }
		expect(extract(obj, ['a', 'd'], { notValueWriteUndefined: false })).toEqual(result)
	})

	it('提取对象指定字段, 不包含原型链上的属性', () => {
		const obj = Object.create({ a: 1, b: 2 })
		obj.c = 3
		const result = { a: undefined, c: 3 }
		expect(extract(obj, ['a', 'c'], { containPrototype: false })).toEqual(result)
	})

	it('提取对象指定字段, 不包含原型链上的属性, 目标不存在不允许写入 undefined', () => {
		const obj = Object.create({ a: 1, b: 2 })
		obj.c = 3
		const result = { c: 3 }
		expect(extract(obj, ['a', 'c'], { containPrototype: false, notValueWriteUndefined: false })).toEqual(result)
	})

	it('提取数组指定下标', () => {
		const arr = [1, 2, 3, 4, 5]
		const result = { 0: 1, 2: 3, 4: 5 }
		expect(extract(arr, [0, 2, 4])).toEqual(result)
	})
})
