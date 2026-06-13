import { describe, expect, it } from 'vitest'
import {
	collectionReadonlyPlugin,
	createReadonlyMethodPlugin,
	dateReadonlyPlugin,
	readonly,
	type ReadonlyPlugin
} from './index.js'

describe('readonly core', () => {
	it('只接受引用类型', () => {
		expect(() => {
			// @ts-expect-error
			readonly(1)
		}).toThrowError()
		expect(() => readonly({})).not.toThrow()
		expect(() => readonly([])).not.toThrow()
	})

	it('阻止普通对象和数组的修改、删除与属性定义', () => {
		const origin = {
			count: 1,
			nested: { count: 2 },
			list: [{ count: 3 }]
		}
		const target = readonly(origin, { tip: 'none' })

		// @ts-ignore
		target.count = 10
		// @ts-ignore
		target.nested.count = 20
		// @ts-ignore
		delete target.nested.count
		Object.defineProperty(target, 'count', { value: 30 })
		target.list.push({ count: 4 })
		// @ts-ignore
		target.list[0].count = 40

		expect(origin).toEqual({
			count: 1,
			nested: { count: 2 },
			list: [{ count: 3 }]
		})
	})

	it('对象方法通过 this 修改时仍会被代理拦截', () => {
		const origin = {
			count: 1,
			increment() {
				this.count++
			}
		}
		const target = readonly(origin, { tip: 'none' })

		target.increment()

		expect(origin.count).toBe(1)
	})

	it('保持循环引用和重复引用的代理身份', () => {
		const child = { count: 1 }
		const origin: { child: typeof child; same: typeof child; self?: unknown } = {
			child,
			same: child
		}
		origin.self = origin
		const target = readonly(origin, { tip: 'none' })

		expect(target.child).toBe(target.same)
		expect(target.self).toBe(target)
	})

	it('浅只读只保护第一层', () => {
		const origin = {
			count: 1,
			nested: { count: 2 }
		}
		const target = readonly.shallowReadonly(origin, { tip: 'none' })

		// @ts-ignore
		target.count = 10
		target.nested.count = 20

		expect(origin.count).toBe(1)
		expect(origin.nested.count).toBe(20)
	})

	it('保留 sign、tip 和原始数据查询能力', () => {
		const origin = { count: 1 }
		const target = readonly(origin, { sign: 'test', tip: 'error' })

		expect(readonly.isReadonly(target)).toBe(true)
		expect(readonly.isDeepReadonly(target)).toBe(true)
		expect(readonly.isShallowReadonly(target)).toBe(false)
		expect(readonly.getTip(target)).toBe('error')
		expect(readonly.toOrigin(target, 'test')).toBe(origin)
		expect(() => readonly.toOrigin(target)).toThrowError()

		const defaultSignTarget = readonly(origin)
		expect(readonly.toOrigin(defaultSignTarget)).toBe(origin)
	})

	it('默认不代理 Date、Map 和类实例', () => {
		class Counter {
			count = 0
		}

		const date = new Date('2020-01-01T00:00:00.000Z')
		const map = new Map<string, number>()
		const counter = new Counter()
		const target = readonly({ date, map, counter }, { tip: 'none' })

		target.date.setUTCFullYear(2021)
		target.map.set('count', 1)
		// @ts-ignore
		target.counter.count = 1

		expect(target.date).toBe(date)
		expect(target.map).toBe(map)
		expect(target.counter).toBe(counter)
		expect(date.getUTCFullYear()).toBe(2021)
		expect(map.get('count')).toBe(1)
		expect(counter.count).toBe(1)
	})
})

describe('readonly plugins', () => {
	it('Date 插件阻止日期修改方法并保留读取能力', () => {
		const date = new Date('2020-01-01T00:00:00.000Z')
		const target = readonly(
			{ date },
			{
				tip: 'none',
				plugins: [dateReadonlyPlugin]
			}
		)

		target.date.setUTCFullYear(2021)

		expect(readonly.isReadonly(target.date)).toBe(true)
		expect(target.date.getUTCFullYear()).toBe(2020)
		expect(target.date.toISOString()).toBe('2020-01-01T00:00:00.000Z')
	})

	it('通用方法插件可阻止用户指定的方法', () => {
		class Counter {
			count = 0

			increment() {
				this.count++
			}

			getCount() {
				return this.count
			}
		}

		const counterPlugin = createReadonlyMethodPlugin<Counter>({
			name: 'counter',
			match: (target): target is Counter => target instanceof Counter,
			methods: ['increment']
		})
		const counter = new Counter()
		const target = readonly(counter, {
			tip: 'none',
			plugins: [counterPlugin]
		})

		target.increment()

		expect(target.getCount()).toBe(0)
		expect(counter.count).toBe(0)
	})

	it('自定义插件可分别阻止和放行属性操作', () => {
		class Config {
			locked = 1
			open = 1
		}

		const plugin: ReadonlyPlugin<Config> = {
			name: 'config',
			match: (target): target is Config => target instanceof Config,
			set(event) {
				return event.property === 'locked' ? event.prevent('set', event.property, event.value) : event.set()
			}
		}
		const origin = new Config()
		const target = readonly(origin, {
			tip: 'none',
			plugins: [plugin]
		})

		// @ts-ignore
		target.locked = 2
		// @ts-ignore
		target.open = 2

		expect(origin.locked).toBe(1)
		expect(origin.open).toBe(2)
	})

	it('集合插件阻止结构修改并深度包装查询结果', () => {
		const value = { count: 1 }
		const origin = new Map([['value', value]])
		const target = readonly(origin, {
			tip: 'none',
			plugins: [collectionReadonlyPlugin]
		})

		target.set('other', { count: 2 })
		const readonlyValue = target.get('value')!
		// @ts-ignore
		readonlyValue.count = 10

		expect(origin.size).toBe(1)
		expect(value.count).toBe(1)
		expect(readonly.isReadonly(readonlyValue)).toBe(true)
	})

	it('集合插件保护 forEach 和迭代器回调中的数据', () => {
		const value = { count: 1 }
		const origin = new Map([['value', value]])
		const target = readonly(origin, {
			tip: 'none',
			plugins: [collectionReadonlyPlugin]
		})

		target.forEach((item, key, map) => {
			// @ts-ignore
			item.count = 10
			map.set(key, { count: 20 })
		})

		target
			.values()
			.map((item) => {
				// @ts-ignore
				item.count = 30
				return item
			})
			.toArray()

		expect(origin.size).toBe(1)
		expect(value.count).toBe(1)
	})

	it('集合插件保留原生回调参数校验', () => {
		const target = readonly(new Map(), {
			plugins: [collectionReadonlyPlugin]
		})

		expect(() => {
			// @ts-expect-error
			target.forEach(undefined)
		}).toThrowError()
	})

	it('浅只读配合集合插件时只保护集合结构', () => {
		const value = { count: 1 }
		const origin = new Map([['value', value]])
		const target = readonly.shallowReadonly(origin, {
			tip: 'none',
			plugins: [collectionReadonlyPlugin]
		})

		target.set('other', { count: 2 })
		target.get('value')!.count = 10

		expect(origin.size).toBe(1)
		expect(value.count).toBe(10)
	})
})
