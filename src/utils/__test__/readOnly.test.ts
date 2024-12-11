import { describe, test, expect } from 'vitest'
import { readonly } from '../index.js'
import { cloneDeep } from 'lodash-es'

describe('readonly.shallowReadonly()', () => {
	test('只允许引用类型', () => {
		expect(() => {
			readonly.shallowReadonly(1)
		}).toThrowError()
		expect(() => {
			readonly.shallowReadonly(() => {})
		}).not.toThrow()
	})

	test('读取', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin)
		expect(target.a).toBe(1)
	})

	test('浅层设置', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin)
		target.a = 2
		expect(target.a).toBe(1)
	})

	test('深层设置', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin)
		target.c.c1 = 4
		expect(target.c.c1).toBe(4)
	})

	test('lodash cloneDeep()', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin)
		expect(cloneDeep(target)).toEqual(origin)
	})

	test('浅层删除', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin)
		delete target.c
		expect(target).toEqual({
			a: 1,
			b: 2,
			c: { c1: 3 }
		})
	})

	test('深层删除', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin)
		delete target.c.c1
		expect(target).toEqual({
			a: 1,
			b: 2,
			c: {}
		})
	})

	test('Object.defindProperty()', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin)
		Object.defineProperty(target, 'a', { value: 4 })
		expect(target).toEqual({
			a: 1,
			b: 2,
			c: { c1: 3 }
		})
	})

	test('已经是 readonly.shallowReadonly', () => {
		const origin = readonly.shallowReadonly({
			a: 1,
			b: 2,
			c: { c1: 3 }
		})

		const target = readonly.shallowReadonly(origin)
		expect(target).toBe(origin)
	})

	test('数组解构', () => {
		const origin = readonly.shallowReadonly([1, [2]])
		// @ts-ignore
		const [a, [b], c] = origin
		expect(a).toBe(1)
		expect(b).toBe(2)
		expect(c).toBe(undefined)
	})

	test('对象解构', () => {
		const origin = readonly.shallowReadonly({ a: 1, b: { b: 2 } })
		const {
			a,
			b: { b },
			// @ts-ignore
			c
		} = origin
		expect(a).toBe(1)
		expect(b).toBe(2)
		expect(c).toBe(undefined)
	})

	test('toOrigin()', () => {
		const origin = readonly.shallowReadonly({ a: 1, b: { b: 2 } }, { sign: 'test' })
		expect(() => {
			readonly.toOrigin(origin)
		}).toThrowError()
		expect(readonly.toOrigin(origin, 'test')).toEqual({ a: 1, b: { b: 2 } })
	})

	test('getTip()', () => {
		const origin = readonly.shallowReadonly({ a: 1, b: { b: 2 } }, { tip: 'error' })
		expect(readonly.getTip(origin)).toBe('error')
	})
})

describe('readonly()', () => {
	test('只允许引用类型', () => {
		expect(() => {
			readonly(1)
		}).toThrowError()
		expect(() => {
			readonly.shallowReadonly(() => {})
		}).not.toThrow()
	})

	test('普通读取', () => {
		const target = readonly({
			c: { c1: 3 }
		})
		expect(target.c.c1).toBe(3)
	})

	test('读取 symbol', () => {
		const c1 = Symbol('c1')
		const target = readonly({
			c: { [c1]: 3 }
		})
		expect(target.c[c1]).toBe(3)
	})

	test('普通设置', () => {
		const origin = {
			c: { c1: 3 }
		}

		const target = readonly(origin)
		target.c.c1 = 2
		expect(target.c.c1).toBe(3)
	})

	test('设置 symbol 属性', () => {
		const c1 = Symbol('c1')
		const origin = {
			c: { [c1]: 3 }
		}

		const target = readonly(origin)
		target.c[c1] = 2
		expect(target.c[c1]).toBe(3)
	})

	test('设置函数上的属性', () => {
		const origin = {
			f() {}
		}

		const target = readonly(origin)
		// @ts-ignore
		target.f.a = 2
		// @ts-ignore
		expect(target.f.a).toBe(undefined)
	})

	test('lodash cloneDeep()', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly(origin)
		expect(cloneDeep(target)).toEqual(origin)
	})

	test('删除', () => {
		const origin = {
			c: { c1: 3 }
		}

		const target = readonly(origin)
		delete target.c.c1
		expect(target).toEqual({
			c: { c1: 3 }
		})
	})

	test('Object.defindProperty()', () => {
		const origin = {
			c: { c1: 3 }
		}

		const target = readonly(origin)
		Object.defineProperty(target.c, 'c1', { value: 4 })
		expect(target).toEqual({
			c: { c1: 3 }
		})
	})

	test('已经是 readonly.shallowReadonly', () => {
		const origin = readonly.shallowReadonly({
			c: { c1: 3 }
		})

		const target = readonly(origin)
		delete target.c.c1
		expect(target).toEqual({ c: { c1: 3 } })
	})

	test('已经是 readonly()', () => {
		const origin = readonly({
			c: { c1: 3 }
		})

		const target = readonly(origin)
		expect(target).toBe(origin)
	})

	test('数组解构', () => {
		const origin = readonly([1, [2]])
		// @ts-ignore
		const [a, [b], c] = origin
		expect(a).toBe(1)
		expect(b).toBe(2)
		expect(c).toBe(undefined)
	})

	test('对象解构', () => {
		const origin = readonly({ a: 1, b: { b: 2 } })
		const {
			a,
			b: { b },
			// @ts-ignore
			c
		} = origin
		expect(a).toBe(1)
		expect(b).toBe(2)
		expect(c).toBe(undefined)
	})

	test('toOrigin()', () => {
		const origin = readonly({ a: 1, b: { b: 2 } }, { sign: 'test' })
		expect(() => {
			readonly.toOrigin(origin)
		}).toThrowError()
		expect(readonly.toOrigin(origin, 'test')).toEqual({ a: 1, b: { b: 2 } })
	})

	test('getTip()', () => {
		const origin = readonly({ a: 1, b: { b: 2 } }, { tip: 'error' })
		expect(readonly.getTip(origin)).toBe('error')
	})
})
