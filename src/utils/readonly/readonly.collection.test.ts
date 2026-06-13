import { describe, expect, it } from 'vitest'
import { collectionReadonlyPlugin, readonly } from './index.js'

const options = {
	tip: 'none' as const,
	plugins: [collectionReadonlyPlugin]
}

describe('collectionReadonlyPlugin Map', () => {
	it('阻止 set/delete/clear 并保持原生返回值形状', () => {
		const map = new Map([['value', 1]])
		const target = readonly(map, options)

		expect(target.set('other', 2)).toBe(target)
		expect(target.delete('value')).toBe(false)
		expect(target.clear()).toBe(undefined)
		expect(Array.from(map)).toEqual([['value', 1]])
	})

	it('包装 object key 和 value，并支持用代理 key 查询', () => {
		const key = { id: 1 }
		const value = { count: 1 }
		const map = new Map([[key, value]])
		const target = readonly(map, options)
		const [readonlyKey, readonlyValue] = target.entries().next().value!

		// @ts-ignore
		readonlyKey.id = 2
		// @ts-ignore
		readonlyValue.count = 2

		expect(target.has(readonlyKey)).toBe(true)
		expect(target.get(readonlyKey)).toBe(readonlyValue)
		expect(key.id).toBe(1)
		expect(value.count).toBe(1)
	})

	it('forEach 包装 value、key 和 collection 参数并保留 thisArg', () => {
		const key = { id: 1 }
		const value = { count: 1 }
		const map = new Map([[key, value]])
		const target = readonly(map, options)
		const thisArg = { called: false }

		target.forEach(function (this: typeof thisArg, readonlyValue, readonlyKey, readonlyMap) {
			this.called = true
			// @ts-ignore
			readonlyValue.count = 2
			// @ts-ignore
			readonlyKey.id = 2
			readonlyMap.clear()
			expect(readonlyMap).toBe(target)
		}, thisArg)

		expect(thisArg.called).toBe(true)
		expect(key.id).toBe(1)
		expect(value.count).toBe(1)
		expect(map.size).toBe(1)
	})
})

describe('collectionReadonlyPlugin Set and weak collections', () => {
	it('Set 阻止 add/delete/clear 并包装值', () => {
		const value = { count: 1 }
		const set = new Set([value])
		const target = readonly(set, options)
		const readonlyValue = target.values().next().value!

		expect(target.add({ count: 2 })).toBe(target)
		expect(target.delete(readonlyValue)).toBe(false)
		expect(target.clear()).toBe(undefined)
		// @ts-ignore
		readonlyValue.count = 2

		expect(target.has(readonlyValue)).toBe(true)
		expect(value.count).toBe(1)
		expect(set.size).toBe(1)
	})

	it('WeakMap 阻止 set/delete 并包装 get 结果', () => {
		const key = {}
		const value = { count: 1 }
		const map = new WeakMap([[key, value]])
		const target = readonly(map, options)
		const readonlyValue = target.get(key)!

		expect(target.set({}, { count: 2 })).toBe(target)
		expect(target.delete(key)).toBe(false)
		// @ts-ignore
		readonlyValue.count = 2

		expect(map.has(key)).toBe(true)
		expect(value.count).toBe(1)
	})

	it('WeakSet 阻止 add/delete 并支持代理值查询', () => {
		const value = {}
		const set = new WeakSet([value])
		const wrapper = readonly({ value }, options)
		const target = readonly(set, options)

		expect(target.add({})).toBe(target)
		expect(target.delete(wrapper.value)).toBe(false)
		expect(target.has(wrapper.value)).toBe(true)
		expect(set.has(value)).toBe(true)
	})
})

describe('collectionReadonlyPlugin modern Set methods', () => {
	it('union/intersection/difference/symmetricDifference 返回只读 Set', () => {
		const first = { id: 1 }
		const second = { id: 2 }
		const target = readonly(new Set([first]), options)
		const other = new Set([second])

		const results = [
			target.union(other),
			target.intersection(new Set([first])),
			target.difference(other),
			target.symmetricDifference(other)
		]

		for (const result of results) {
			expect(readonly.isReadonly(result)).toBe(true)
			result.clear()
		}
		expect(results.map((result) => result.size)).toEqual([2, 1, 1, 2])
	})

	it('关系查询方法保持可用', () => {
		const target = readonly(new Set([1, 2]), options)

		expect(target.isSubsetOf(new Set([1, 2, 3]))).toBe(true)
		expect(target.isSupersetOf(new Set([1]))).toBe(true)
		expect(target.isDisjointFrom(new Set([3]))).toBe(true)
	})
})

describe('collection iterator helpers', () => {
	it('map/filter/flatMap 链式结果保持只读', () => {
		const first = { count: 1 }
		const second = { count: 2 }
		const target = readonly(new Set([first, second]), options)

		const values = target
			.values()
			.map((value) => {
				// @ts-ignore
				value.count = 10
				return value
			})
			.filter((value) => value.count > 0)
			.flatMap((value) => [value])
			.toArray()

		expect(values).toHaveLength(2)
		expect(values[0]).toBe(target.values().next().value)
		expect(first.count).toBe(1)
		expect(second.count).toBe(2)
	})

	it('some/every/find/forEach 回调接收只读值', () => {
		const value = { count: 1 }
		const target = readonly(new Set([value]), options)

		expect(
			target.values().some((item) => {
				// @ts-ignore
				item.count = 2
				return true
			})
		).toBe(true)
		expect(target.values().every((item) => item.count === 1)).toBe(true)
		expect(target.values().find((item) => item.count === 1)).toBe(target.values().next().value)
		target.values().forEach((item) => {
			// @ts-ignore
			item.count = 3
		})

		expect(value.count).toBe(1)
	})

	it('reduce 无初始值时保护 accumulator，有初始值时保留外部对象身份', () => {
		const first = { count: 1 }
		const second = { count: 2 }
		const target = readonly(new Set([first, second]), options)

		const reduced = target.values().reduce((accumulator, value) => {
			// @ts-ignore
			accumulator.count = 10
			// @ts-ignore
			value.count = 20
			return accumulator
		})
		const external = { total: 0 }
		const externalResult = target.values().reduce((accumulator, value) => {
			accumulator.total += value.count
			return accumulator
		}, external)

		expect(reduced).toBe(target.values().next().value)
		expect(externalResult).toBe(external)
		expect(external.total).toBe(3)
		expect(first.count).toBe(1)
		expect(second.count).toBe(2)
	})

	it('take/drop/toArray 和 for...of 保持可用', () => {
		const target = readonly(new Set([{ id: 1 }, { id: 2 }, { id: 3 }]), options)
		const taken = target.values().take(2).toArray()
		const dropped = target.values().drop(2).toArray()
		const iterated = [...target]

		expect(taken.map((value) => value.id)).toEqual([1, 2])
		expect(dropped.map((value) => value.id)).toEqual([3])
		expect(iterated.map((value) => value.id)).toEqual([1, 2, 3])
		for (const value of [...taken, ...dropped, ...iterated]) {
			expect(readonly.isReadonly(value)).toBe(true)
		}
	})
})
