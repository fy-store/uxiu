import { describe, test, expect } from 'vitest'
import { readOnly } from '../index.js'
import { cloneDeep } from 'lodash-es'

describe('readOnly() / tip', () => {
	test('error', () => {
		const origin = {
			a: 1,
			b: 2,
			c: ['a', 'b']
		}
		const newObj = readOnly(origin, { tip: 'error' })

		expect(() => {
			newObj.c = []
		}).toThrowError()
	})

	test('warn', () => {
		const origin = {
			a: 1,
			b: 2,
			c: ['a', 'b']
		}
		const newObj = readOnly(origin, { tip: 'warn' })
		newObj.c = []

		expect(newObj).toEqual({
			a: 1,
			b: 2,
			c: ['a', 'b']
		})
	})

	test('none', () => {
		const origin = {
			a: 1,
			b: 2,
			c: ['a', 'b']
		}
		const newObj = readOnly(origin, { tip: 'none' })
		newObj.c = []

		expect(newObj).toEqual({
			a: 1,
			b: 2,
			c: ['a', 'b']
		})
	})
})

describe('readOnly() / mode', () => {
	test('currency', () => {
		const origin = {
			a: 1,
			b: 2,
			c: ['a', 'b']
		}
		const newObj = readOnly(origin, { tip: 'none', mode: 'currency' })
		// 尝试修改
		newObj.c = []
		// 尝试删除
		delete newObj.c
		// 尝试重定义
		Object.defineProperty(newObj, 'd', { value: 1 })
		// 尝试结构后改值
		const { c } = newObj
		c[0] = '2'
		// 尝试读取引用值修改
		newObj.c[0] = '3'

		const target = {
			a: 1,
			b: 2,
			c: ['a', 'b']
		}
		// 尝试使用方法获取
		expect(newObj.c.at(0)).toBe('a')
		// 尝试克隆
		expect(cloneDeep(newObj)).toEqual(target)
		return
		// 尝试序列化
		expect(JSON.parse(JSON.stringify(newObj))).toEqual(target)

		// 尝试调用方法改值
		const arr = readOnly([1, 2, 3], { tip: 'none', mode: 'currency' })
		arr.push(4)
		expect(arr).toEqual([1, 2, 3, 4])
	})

	// test('limitedThis', () => {
	// 	const origin = {
	// 		a: 1,
	// 		b: 2,
	// 		c: ['a', 'b']
	// 	}
	// 	const newObj = readOnly(origin, { tip: 'none', mode: 'limitedThis' })
	// 	// 尝试修改
	// 	newObj.c = []
	// 	// 尝试删除
	// 	delete newObj.c
	// 	// 尝试重定义
	// 	Object.defineProperty(newObj, 'd', { value: 1 })
	// 	// 尝试结构后改值
	// 	const { c } = newObj
	// 	c[0] = '2'
	// 	// 尝试读取引用值修改
	// 	newObj.c[0] = '3'

	// 	const target = {
	// 		a: 1,
	// 		b: 2,
	// 		c: ['a', 'b']
	// 	}
	// 	// 尝试克隆
	// 	expect(cloneDeep(newObj)).toEqual(target)
	// 	// 尝试序列化
	// 	expect(JSON.parse(JSON.stringify(newObj))).toEqual(target)
	// 	// 尝试使用方法获取
	// 	expect(newObj.c.at(0)).toBe('a')

	// 	// // 尝试调用方法改值
	// 	// const arr = readOnly([1, 2, 3], { tip: 'none', mode: 'limitedThis' })
	// 	// arr.push(4)
	// 	// expect(arr).toEqual([1, 2, 3, 4])
	// })
})
