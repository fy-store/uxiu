import { describe, expect, it } from 'vitest'
import { readonly, type ReadonlyPlugin } from './index.js'

describe('readonly array operations', () => {
	const mutationCases: Array<[string, (target: number[]) => unknown]> = [
		['push', (target) => target.push(4)],
		['pop', (target) => target.pop()],
		['shift', (target) => target.shift()],
		['unshift', (target) => target.unshift(0)],
		['splice', (target) => target.splice(1, 1, 9)],
		['sort', (target) => target.sort()],
		['reverse', (target) => target.reverse()],
		['fill', (target) => target.fill(9)],
		['copyWithin', (target) => target.copyWithin(0, 1)]
	]

	it.each(mutationCases)('阻止 Array.%s() 修改原数组', (_name, mutate) => {
		const origin = [3, 1, 2]
		const target = readonly(origin, { tip: 'none' })

		mutate(target)

		expect(origin).toEqual([3, 1, 2])
	})

	it('阻止直接索引、length 和 symbol 属性修改', () => {
		const symbol = Symbol('value')
		const origin = Object.assign([1, 2, 3], { [symbol]: 1 })
		const target = readonly(origin, { tip: 'none' })

		// @ts-ignore
		target[0] = 9
		// @ts-ignore
		target.length = 0
		// @ts-ignore
		target[symbol] = 2

		expect(Array.from(origin)).toEqual([1, 2, 3])
		expect(origin[symbol]).toBe(1)
	})

	it('数组回调收到深层只读元素', () => {
		const first = { count: 1 }
		const second = { count: 2 }
		const target = readonly([first, second], { tip: 'none' })

		target.forEach((value) => {
			// @ts-ignore
			value.count = 10
		})
		const mapped = target.map((value) => {
			// @ts-ignore
			value.count = 20
			return value.count
		})

		expect(mapped).toEqual([1, 2])
		expect(first.count).toBe(1)
		expect(second.count).toBe(2)
	})

	it('数组解构、includes、find 和迭代保持可用及代理身份稳定', () => {
		const first = { id: 1 }
		const second = { id: 2 }
		const target = readonly([first, second])
		const [readonlyFirst, readonlySecond] = target

		expect(readonlyFirst).toBe(target[0])
		expect(readonlySecond).toBe(target[1])
		expect(target.includes(readonlyFirst)).toBe(true)
		expect(target.find((value) => value.id === 2)).toBe(readonlySecond)
		expect([...target]).toEqual([readonlyFirst, readonlySecond])
	})

	it('非修改型方法返回的新数组不影响原数组', () => {
		const origin = [1, 2, 3]
		const target = readonly(origin)
		const sliced = target.slice(1)
		const mapped = target.map((value) => value * 2)
		const filtered = target.filter((value) => value > 1)

		sliced.push(4)
		mapped.push(8)
		filtered.push(4)

		expect(origin).toEqual([1, 2, 3])
		expect(sliced).toEqual([2, 3, 4])
		expect(mapped).toEqual([2, 4, 6, 8])
		expect(filtered).toEqual([2, 3, 4])
	})
})

describe('readonly plugin hooks', () => {
	class Target {
		locked = 1
		open = 1
	}

	it('首个匹配插件优先', () => {
		const calls: string[] = []
		const first: ReadonlyPlugin<Target> = {
			name: 'first',
			match: (target): target is Target => target instanceof Target,
			get(event) {
				calls.push('first')
				return event.get()
			}
		}
		const second: ReadonlyPlugin<Target> = {
			name: 'second',
			match: (target): target is Target => target instanceof Target,
			get(event) {
				calls.push('second')
				return event.get()
			}
		}
		const target = readonly(new Target(), { plugins: [first, second] })

		expect(target.locked).toBe(1)
		expect(calls).toEqual(['first'])
	})

	it('get 钩子可自定义读取结果', () => {
		const plugin: ReadonlyPlugin<Target> = {
			match: (target): target is Target => target instanceof Target,
			get(event) {
				return event.property === 'locked' ? 100 : event.get()
			}
		}
		const target = readonly(new Target(), { plugins: [plugin] })

		expect(target.locked).toBe(100)
		expect(target.open).toBe(1)
	})

	it('deleteProperty 钩子可选择阻止或放行', () => {
		const plugin: ReadonlyPlugin<Target> = {
			match: (target): target is Target => target instanceof Target,
			deleteProperty(event) {
				return event.property === 'locked' ? event.prevent('deleteProperty', event.property) : event.delete()
			}
		}
		const origin = new Target()
		const target = readonly(origin, { tip: 'none', plugins: [plugin] })

		// @ts-ignore
		delete target.locked
		// @ts-ignore
		delete target.open

		expect(origin).toEqual({ locked: 1 })
	})

	it('defineProperty 钩子可选择阻止或放行', () => {
		const plugin: ReadonlyPlugin<Target> = {
			match: (target): target is Target => target instanceof Target,
			defineProperty(event) {
				return event.property === 'locked'
					? event.prevent('defineProperty', event.property)
					: event.define()
			}
		}
		const origin = new Target()
		const target = readonly(origin, { tip: 'none', plugins: [plugin] })

		Object.defineProperty(target, 'locked', { value: 2 })
		Object.defineProperty(target, 'open', { value: 2 })

		expect(origin.locked).toBe(1)
		expect(origin.open).toBe(2)
	})

	it('apply 钩子可拦截函数调用', () => {
		const fn = (value: number) => value * 2
		const plugin: ReadonlyPlugin<typeof fn> = {
			match: (target): target is typeof fn => target === fn,
			apply(event) {
				return event.args[0] === 2 ? 100 : event.apply()
			}
		}
		const target = readonly(fn, { plugins: [plugin] })

		expect(target(2)).toBe(100)
		expect(target(3)).toBe(6)
	})

	it('construct 钩子可调整构造参数', () => {
		class Value {
			constructor(public value: number) {}
		}

		const plugin: ReadonlyPlugin<typeof Value> = {
			match: (target): target is typeof Value => target === Value,
			construct(event) {
				event.args[0] *= 2
				return event.construct()
			}
		}
		const TargetValue = readonly(Value, { plugins: [plugin] })

		expect(new TargetValue(2).value).toBe(4)
	})
})
