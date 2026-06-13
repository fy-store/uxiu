import { describe, expect, it } from 'vitest'
import { createReadonlyMethodPlugin, dateReadonlyPlugin, readonly } from './index.js'

describe('readonly native objects', () => {
	it('默认保留带 #private 属性的 class 实例和方法行为', () => {
		class Vault {
			#value = 1

			increment() {
				this.#value++
			}

			get value() {
				return this.#value
			}
		}

		const vault = new Vault()
		const target = readonly({ vault }, { tip: 'none' })

		target.vault.increment()

		expect(target.vault).toBe(vault)
		expect(target.vault.value).toBe(2)
		expect(readonly.isReadonly(target.vault)).toBe(false)
	})

	it('方法插件调用 class 方法时支持 #private 属性', () => {
		class Vault {
			#value = 1

			increment() {
				this.#value++
			}

			getValue() {
				return this.#value
			}

			get value() {
				return this.#value
			}
		}

		const plugin = createReadonlyMethodPlugin<Vault>({
			name: 'vault',
			match: (target): target is Vault => target instanceof Vault,
			methods: ['increment']
		})
		const vault = new Vault()
		const target = readonly(vault, {
			tip: 'none',
			plugins: [plugin]
		})

		target.increment()

		expect(target instanceof Vault).toBe(true)
		expect(target.constructor).toBe(Vault)
		expect(target.getValue()).toBe(1)
		expect(target.value).toBe(1)
		expect(vault.getValue()).toBe(1)
	})

	it('自定义插件可以允许通过方法修改 #private 属性', () => {
		class Vault {
			#value = 1

			increment() {
				this.#value++
				return this.#value
			}

			get value() {
				return this.#value
			}
		}

		const plugin = createReadonlyMethodPlugin<Vault>({
			match: (target): target is Vault => target instanceof Vault,
			methods: []
		})
		const vault = new Vault()
		const target = readonly(vault, { plugins: [plugin] })

		expect(target.increment()).toBe(2)
		expect(target.value).toBe(2)
		expect(vault.value).toBe(2)
	})

	const nativeObjects: Array<[string, object]> = [
		['Date', new Date()],
		['Map', new Map()],
		['Set', new Set()],
		['WeakMap', new WeakMap()],
		['WeakSet', new WeakSet()],
		['ArrayBuffer', new ArrayBuffer(8)],
		['SharedArrayBuffer', new SharedArrayBuffer(8)],
		['DataView', new DataView(new ArrayBuffer(8))],
		['Uint8Array', new Uint8Array(8)],
		['RegExp', /test/g],
		['URL', new URL('https://example.com/path')],
		['URLSearchParams', new URLSearchParams('a=1')],
		['Error', new Error('test')],
		['Promise', Promise.resolve(1)]
	]

	it.each(nativeObjects)('默认不代理 %s', (_name, value) => {
		const target = readonly({ value })

		expect(target.value).toBe(value)
		expect(readonly.isReadonly(target.value)).toBe(false)
	})

	it('未配置插件时原生对象仍可按原生方式修改', () => {
		const date = new Date('2020-01-01T00:00:00.000Z')
		const map = new Map<string, number>()
		const set = new Set<number>()
		const buffer = new ArrayBuffer(8, { maxByteLength: 16 })
		const bytes = new Uint8Array(buffer)
		const regexp = /a/g
		const url = new URL('https://example.com/')
		const params = new URLSearchParams('a=1')
		const target = readonly({ date, map, set, buffer, bytes, regexp, url, params })

		target.date.setUTCFullYear(2021)
		target.map.set('value', 1)
		target.set.add(1)
		// @ts-ignore
		target.bytes[0] = 10
		target.buffer.resize(16)
		// @ts-ignore
		target.regexp.lastIndex = 1
		// @ts-ignore
		target.url.pathname = '/changed'
		target.params.set('a', '2')

		expect(date.getUTCFullYear()).toBe(2021)
		expect(map.get('value')).toBe(1)
		expect(set.has(1)).toBe(true)
		expect(bytes[0]).toBe(10)
		expect(buffer.byteLength).toBe(16)
		expect(regexp.lastIndex).toBe(1)
		expect(url.pathname).toBe('/changed')
		expect(params.get('a')).toBe('2')
	})
})

describe('dateReadonlyPlugin', () => {
	const dateSetters: Array<[string, any[]]> = [
		['setDate', [2]],
		['setFullYear', [2021]],
		['setHours', [1]],
		['setMilliseconds', [1]],
		['setMinutes', [1]],
		['setMonth', [1]],
		['setSeconds', [1]],
		['setTime', [1]],
		['setUTCDate', [2]],
		['setUTCFullYear', [2021]],
		['setUTCHours', [1]],
		['setUTCMilliseconds', [1]],
		['setUTCMinutes', [1]],
		['setUTCMonth', [1]],
		['setUTCSeconds', [1]],
		['setYear', [121]]
	]

	it.each(dateSetters)('阻止 Date.%s()', (method, args) => {
		const date = new Date('2020-01-01T00:00:00.000Z')
		const target = readonly(date, {
			tip: 'none',
			plugins: [dateReadonlyPlugin]
		})

		Reflect.apply((target as any)[method], target, args)

		expect(date.toISOString()).toBe('2020-01-01T00:00:00.000Z')
	})

	it('支持 Date getter、格式化和安全返回新实例的方法', () => {
		const date = new Date('2020-01-02T03:04:05.006Z')
		const target = readonly(date, {
			plugins: [dateReadonlyPlugin]
		})

		expect(target.getUTCFullYear()).toBe(2020)
		expect(target.getUTCMonth()).toBe(0)
		expect(target.toISOString()).toBe('2020-01-02T03:04:05.006Z')
		expect(target.toJSON()).toBe('2020-01-02T03:04:05.006Z')
		expect(Number(target)).toBe(date.getTime())
	})

	it('Date 作为普通对象属性时会使用同一插件配置递归包装', () => {
		const date = new Date('2020-01-01T00:00:00.000Z')
		const target = readonly(
			{ nested: { date } },
			{
				tip: 'none',
				plugins: [dateReadonlyPlugin]
			}
		)

		target.nested.date.setUTCFullYear(2021)

		expect(readonly.isReadonly(target.nested.date)).toBe(true)
		expect(date.getUTCFullYear()).toBe(2020)
	})
})
