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

		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		// @ts-expect-error
		target.a = 2
		expect(target.a).toBe(1)
	})

	test('深层设置', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		target.c.c1 = 4
		expect(target.c.c1).toBe(4)
	})

	test('lodash cloneDeep()', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		expect(cloneDeep(target)).toEqual(origin)
	})

	test('浅层删除', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}

		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		// @ts-expect-error
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

		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		// @ts-ignore
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

		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		Object.defineProperty(target, 'a', { value: 4 })
		expect(target).toEqual({
			a: 1,
			b: 2,
			c: { c1: 3 }
		})
	})

	test('已经是 readonly.shallowReadonly', () => {
		const origin = readonly.shallowReadonly(
			{
				a: 1,
				b: 2,
				c: { c1: 3 }
			},
			{ tip: 'none' }
		)

		const target = readonly.shallowReadonly(origin, { tip: 'none' })
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
		const origin = readonly.shallowReadonly({ a: 1, b: { b: 2 } }, { tip: 'none' })
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
		const origin = readonly.shallowReadonly({ a: 1, b: { b: 2 } }, { sign: 'test', tip: 'none' })
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

		const target = readonly(origin, { tip: 'none' })
		// @ts-ignore
		target.c.c1 = 2
		expect(target.c.c1).toBe(3)
	})

	test('设置 symbol 属性', () => {
		const c1 = Symbol('c1')
		const origin = {
			c: { [c1]: 3 }
		}

		const target = readonly(origin, { tip: 'none' })
		// @ts-ignore
		target.c[c1] = 2
		expect(target.c[c1]).toBe(3)
	})

	test('设置函数上的属性', () => {
		const origin = {
			f() {}
		}

		const target = readonly(origin, { tip: 'none' })
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

		const target = readonly(origin, { tip: 'none' })
		expect(cloneDeep(target)).toEqual(origin)
	})

	test('删除', () => {
		const origin = {
			c: { c1: 3 }
		}

		const target = readonly(origin, { tip: 'none' })
		// @ts-ignore
		delete target.c.c1
		expect(target).toEqual({
			c: { c1: 3 }
		})
	})

	test('Object.defindProperty()', () => {
		const origin = {
			c: { c1: 3 }
		}

		const target = readonly(origin, { tip: 'none' })
		Object.defineProperty(target.c, 'c1', { value: 4 })
		expect(target).toEqual({
			c: { c1: 3 }
		})
	})

	test('已经是 readonly.shallowReadonly', () => {
		const origin = readonly.shallowReadonly({
			c: { c1: 3 }
		})

		const target = readonly(origin, { tip: 'none' })
		// @ts-ignore
		delete target.c.c1
		expect(target).toEqual({ c: { c1: 3 } })
	})

	test('已经是 readonly()', () => {
		const origin = readonly(
			{
				c: { c1: 3 }
			},
			{ tip: 'none' }
		)

		const target = readonly(origin, { tip: 'none' })
		expect(target).toBe(origin)
	})

	test('数组解构', () => {
		const origin = readonly([1, [2]], { tip: 'none' })
		// @ts-ignore
		const [a, [b], c] = origin
		expect(a).toBe(1)
		expect(b).toBe(2)
		expect(c).toBe(undefined)
	})

	test('对象解构', () => {
		const origin = readonly({ a: 1, b: { b: 2 } }, { tip: 'none' })
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

	test('array includes()', () => {
		const origin = readonly([{}, {}], { tip: 'none' })
		const first = origin[0]
		expect(origin.includes(first)).toBe(true)
	})

	test('array readonly item includes()', () => {
		const a = readonly([readonly({})])
		const b = readonly([])
		const origin = readonly([a, b], { tip: 'none' })
		expect(origin[0].includes(origin[0][0])).toBe(true)
	})

	test('readonly date object to JSON', () => {
		const origin = {
			date: new Date()
		}
		const target = readonly(origin)
		expect(() => {
			JSON.stringify(target)
		}).not.toThrowError()
		expect(JSON.stringify(target)).toBe(JSON.stringify(origin))
	})

	test('readonly.shallowReadonly date object to JSON', () => {
		const origin = {
			date: new Date()
		}
		const target = readonly.shallowReadonly(origin)
		expect(() => {
			JSON.stringify(target)
		}).not.toThrowError()
		expect(JSON.stringify(target)).toBe(JSON.stringify(origin))
	})
})
