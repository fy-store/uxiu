import { describe, it, expect } from 'vitest'
import { readonly } from './index.js'
import { cloneDeep } from 'lodash-es'

describe('readonly.shallowReadonly()', () => {
	it('只允许引用类型', () => {
		expect(() => {
			readonly.shallowReadonly(1)
		}).toThrowError()
		expect(() => {
			readonly.shallowReadonly(() => {})
		}).not.toThrow()
	})

	it('读取', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}
		const target = readonly.shallowReadonly(origin)
		expect(target.a).toBe(1)
	})

	it('浅层设置', () => {
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

	it('深层设置', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 }
		}
		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		target.c.c1 = 4
		expect(target.c.c1).toBe(4)
	})

	it('lodash cloneDeep()', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 },
			buf: new ArrayBuffer(8)
		}
		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		expect(cloneDeep(target)).toEqual(origin)
	})

	it('浅层删除', () => {
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

	it('深层删除', () => {
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

	it('Object.defindProperty()', () => {
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

	it('已经是 readonly.shallowReadonly', () => {
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

	it('已经是深度 readonly', () => {
		const origin = readonly(
			{
				a: 1,
				b: 2,
				c: { c1: 3 }
			},
			{ tip: 'none' }
		)
		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		expect(readonly.isDeepReadonly(target)).toBe(true)
	})

	it('数组解构', () => {
		const origin = readonly.shallowReadonly([1, [2]])
		// @ts-ignore
		const [a, [b], c] = origin
		expect(a).toBe(1)
		expect(b).toBe(2)
		expect(c).toBe(undefined)
	})

	it('对象解构', () => {
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

	it('toOrigin()', () => {
		const origin = readonly.shallowReadonly({ a: 1, b: { b: 2 } }, { sign: 'test', tip: 'none' })
		expect(() => {
			readonly.toOrigin(origin)
		}).toThrowError()
		expect(readonly.toOrigin(origin, 'test')).toEqual({ a: 1, b: { b: 2 } })
	})

	it('getTip()', () => {
		const origin = readonly.shallowReadonly({ a: 1, b: { b: 2 } }, { tip: 'error' })
		expect(readonly.getTip(origin)).toBe('error')
	})

	it('浅层只读对象日期属性转为 JSON', () => {
		const origin = {
			date: new Date()
		}
		const target = readonly.shallowReadonly(origin)
		expect(() => {
			JSON.stringify(target)
		}).not.toThrowError()
		expect(JSON.stringify(target)).toBe(JSON.stringify(origin))
	})

	it('函数属性调用通过 this 改值', () => {
		const origin = {
			a: 1,
			increment() {
				this.a++
			}
		}
		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		target.increment()
		expect(target.a).toBe(2)
	})

	it('class 实例', () => {
		class A {
			a = 0
			constructor() {
				this.a = 1
			}
		}
		const origin = {
			A
		}
		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		const a = new target.A()
		expect(a.a).toBe(1)
	})

	it('class 继承', () => {
		class A {
			a = 0
			constructor() {
				this.a = 1
			}
		}
		const origin = {
			A
		}
		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		class B extends target.A {
			constructor() {
				super()
			}
		}

		expect(new B().a).toBe(1)
	})

	it('buf 读取', () => {
		const origin = {
			buf: new ArrayBuffer(16)
		}
		const target = readonly.shallowReadonly(origin, { tip: 'none' })
		expect(target.buf.slice(0, 8)).toEqual(origin.buf.slice(0, 8))
		expect(target.buf.byteLength).toBe(16)
	})
})

describe('readonly()', () => {
	it('只允许引用类型', () => {
		expect(() => {
			readonly(1)
		}).toThrowError()
		expect(() => {
			readonly({})
			readonly([])
			readonly(() => {})
		}).not.toThrow()
	})

	it('普通读取', () => {
		const target = readonly({
			c: { c1: 3 }
		})
		expect(target.c.c1).toBe(3)
	})

	it('读取 symbol', () => {
		const c1 = Symbol('c1')
		const target = readonly({
			c: { [c1]: 3 }
		})
		expect(target.c[c1]).toBe(3)
	})

	it('普通设置', () => {
		const origin = {
			c: { c1: 3 }
		}
		const target = readonly(origin, { tip: 'none' })
		// @ts-ignore
		target.c.c1 = 2
		expect(target.c.c1).toBe(3)
	})

	it('设置 symbol 属性', () => {
		const c1 = Symbol('c1')
		const origin = {
			c: { [c1]: 3 }
		}
		const target = readonly(origin, { tip: 'none' })
		// @ts-ignore
		target.c[c1] = 2
		expect(target.c[c1]).toBe(3)
	})

	it('设置函数上的属性', () => {
		const origin = {
			f() {}
		}
		const target = readonly(origin, { tip: 'none' })
		// @ts-ignore
		target.f.a = 2
		// @ts-ignore
		expect(target.f.a).toBe(undefined)
	})

	it('lodash cloneDeep()', () => {
		const origin = {
			a: 1,
			b: 2,
			c: { c1: 3 },
			buf: new ArrayBuffer(8)
		}
		const target = readonly(origin, { tip: 'none' })
		expect(cloneDeep(target)).toEqual(origin)
	})

	it('删除属性', () => {
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

	it('Object.defindProperty()', () => {
		const origin = {
			c: { c1: 3 }
		}
		const target = readonly(origin, { tip: 'none' })
		Object.defineProperty(target.c, 'c1', { value: 4 })
		expect(target).toEqual({
			c: { c1: 3 }
		})
	})

	it('已经是 readonly.shallowReadonly', () => {
		const origin = readonly.shallowReadonly({
			c: { c1: 3 }
		})
		const target = readonly(origin, { tip: 'none' })
		// @ts-ignore
		delete target.c.c1
		expect(target).toEqual({ c: { c1: 3 } })
	})

	it('已经是深度 readonly', () => {
		const origin = readonly(
			{
				c: { c1: 3 }
			},
			{ tip: 'none' }
		)
		const target = readonly(origin, { tip: 'none' })
		expect(target).toBe(origin)
	})

	it('数组解构', () => {
		const origin = readonly([1, [2]], { tip: 'none' })
		// @ts-ignore
		const [a, [b], c] = origin
		expect(a).toBe(1)
		expect(b).toBe(2)
		expect(c).toBe(undefined)
	})

	it('对象解构', () => {
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

	it('toOrigin()', () => {
		const origin = readonly({ a: 1, b: { b: 2 } }, { sign: 'test' })
		expect(() => {
			readonly.toOrigin(origin)
		}).toThrowError()
		expect(readonly.toOrigin(origin, 'test')).toEqual({ a: 1, b: { b: 2 } })
	})

	it('getTip()', () => {
		const origin = readonly({ a: 1, b: { b: 2 } }, { tip: 'error' })
		expect(readonly.getTip(origin)).toBe('error')
	})

	it('只读数组 includes()', () => {
		const origin = readonly([{}, {}], { tip: 'none' })
		const first = origin[0]
		expect(origin.includes(first)).toBe(true)
	})

	it('只读数组子项 includes()', () => {
		const a = readonly([readonly({})])
		const b = readonly([])
		const origin = readonly([a, b], { tip: 'none' })
		expect(origin[0].includes(origin[0][0])).toBe(true)
	})

	it('只读对象日期属性转为 JSON', () => {
		const origin = {
			date: new Date()
		}
		const target = readonly(origin)
		expect(() => {
			JSON.stringify(target)
		}).not.toThrowError()
		expect(JSON.stringify(target)).toBe(JSON.stringify(origin))
	})

	it('函数属性调用通过 this 改值', () => {
		const origin = {
			a: 1,
			increment() {
				this.a++
			}
		}
		const target = readonly(origin, { tip: 'none' })
		target.increment()
		expect(target.a).toBe(2)
	})

	it('class 实例', () => {
		class A {
			a = 0
			constructor() {
				this.a = 1
			}
		}
		const origin = {
			A
		}
		const target = readonly(origin, { tip: 'none' })
		const a = new target.A()
		expect(a.a).toBe(1)
	})

	it('class 继承', () => {
		class A {
			a = 0
			constructor() {
				this.a = 1
			}
		}
		const origin = {
			A
		}
		const target = readonly(origin, { tip: 'none' })
		class B extends target.A {
			constructor() {
				super()
			}
		}

		expect(new B().a).toBe(1)
	})

	it('buf 读取', () => {
		const origin = {
			buf: new ArrayBuffer(16)
		}
		const target = readonly(origin, { tip: 'none' })
		expect(target.buf.slice(0, 8)).toEqual(origin.buf.slice(0, 8))
		expect(target.buf.byteLength).toBe(16)
	})
})
