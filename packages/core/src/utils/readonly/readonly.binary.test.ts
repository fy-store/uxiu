import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import {
	arrayBufferReadonlyPlugin,
	binaryReadonlyPlugins,
	dataViewReadonlyPlugin,
	readonly,
	typedArrayReadonlyPlugin
} from './index.js'

describe('arrayBufferReadonlyPlugin', () => {
	it('阻止 resizable ArrayBuffer resize、transfer 和 transferToFixedLength', () => {
		const buffer = new ArrayBuffer(8, { maxByteLength: 16 })
		const target = readonly(buffer, {
			tip: 'none',
			plugins: [arrayBufferReadonlyPlugin]
		})

		target.resize(16)
		target.transfer()
		target.transferToFixedLength()

		expect(buffer.byteLength).toBe(8)
		expect(buffer.detached).toBe(false)
		expect(target.byteLength).toBe(8)
		expect(target.maxByteLength).toBe(16)
		expect(target.resizable).toBe(true)
	})

	it('ArrayBuffer.slice() 返回的数据继续保持只读', () => {
		const buffer = new ArrayBuffer(8, { maxByteLength: 16 })
		new Uint8Array(buffer).set([1, 2, 3, 4])
		const target = readonly(buffer, {
			plugins: [arrayBufferReadonlyPlugin]
		})

		const sliced = target.slice(0, 4)

		expect(readonly.isReadonly(sliced)).toBe(true)
		expect(sliced.byteLength).toBe(4)
		expect(Array.from(new Uint8Array(readonly.toOrigin(sliced)))).toEqual([1, 2, 3, 4])
	})

	it('阻止 growable SharedArrayBuffer grow', () => {
		const buffer = new SharedArrayBuffer(8, { maxByteLength: 16 })
		const target = readonly(buffer, {
			tip: 'none',
			plugins: [arrayBufferReadonlyPlugin]
		})

		target.grow(16)

		expect(buffer.byteLength).toBe(8)
		expect(target.byteLength).toBe(8)
		expect(target.maxByteLength).toBe(16)
		expect(target.growable).toBe(true)
	})

	it('SharedArrayBuffer.slice() 返回新的只读 SharedArrayBuffer', () => {
		const buffer = new SharedArrayBuffer(8)
		new Uint8Array(buffer).set([1, 2, 3, 4])
		const target = readonly(buffer, {
			plugins: [arrayBufferReadonlyPlugin]
		})

		const sliced = target.slice(0, 4)

		expect(readonly.isReadonly(sliced)).toBe(true)
		expect(sliced.byteLength).toBe(4)
		expect(Array.from(new Uint8Array(readonly.toOrigin(sliced)))).toEqual([1, 2, 3, 4])
	})
})

describe('dataViewReadonlyPlugin', () => {
	const setters: Array<[string, any]> = (
		[
			['setInt8', 1],
			['setUint8', 1],
			['setInt16', 1],
			['setUint16', 1],
			['setInt32', 1],
			['setUint32', 1],
			['setFloat16', 1.5],
			['setFloat32', 1.5],
			['setFloat64', 1.5],
			['setBigInt64', 1n],
			['setBigUint64', 1n]
		] as Array<[string, any]>
	).filter(([method]) => typeof (DataView.prototype as any)[method] === 'function')

	it.each(setters)('阻止 DataView.%s()', (method, value) => {
		const buffer = new ArrayBuffer(16)
		const view = new DataView(buffer)
		const target = readonly(view, {
			tip: 'none',
			plugins: [dataViewReadonlyPlugin]
		})

		;(target as any)[method](0, value)

		expect(Array.from(new Uint8Array(buffer))).toEqual(new Array(16).fill(0))
	})

	it('允许 DataView getter 读取原始数据', () => {
		const buffer = new ArrayBuffer(16)
		const view = new DataView(buffer, 4, 8)
		view.setInt32(0, 123)
		const target = readonly(view, {
			plugins: [dataViewReadonlyPlugin]
		})

		expect(target.byteOffset).toBe(4)
		expect(target.byteLength).toBe(8)
		expect(target.getInt32(0)).toBe(123)
	})

	it('组合插件会继续包装 DataView.buffer', () => {
		const buffer = new ArrayBuffer(8, { maxByteLength: 16 })
		const view = new DataView(buffer)
		const target = readonly(view, {
			tip: 'none',
			plugins: binaryReadonlyPlugins
		})

		target.buffer.resize(16)

		expect(readonly.isReadonly(target.buffer)).toBe(true)
		expect(buffer.byteLength).toBe(8)
	})
})

describe('typedArrayReadonlyPlugin', () => {
	const typedArrays: Array<[string, new (values: any[]) => any, any, any]> = [
		['Int8Array', Int8Array, 1, 9],
		['Uint8Array', Uint8Array, 1, 9],
		['Uint8ClampedArray', Uint8ClampedArray, 1, 9],
		['Int16Array', Int16Array, 1, 9],
		['Uint16Array', Uint16Array, 1, 9],
		['Int32Array', Int32Array, 1, 9],
		['Uint32Array', Uint32Array, 1, 9],
		['Float32Array', Float32Array, 1.5, 9.5],
		['Float64Array', Float64Array, 1.5, 9.5],
		['BigInt64Array', BigInt64Array, 1n, 9n],
		['BigUint64Array', BigUint64Array, 1n, 9n]
	]

	const Float16ArrayConstructor = (globalThis as Record<string, any>).Float16Array
	if (typeof Float16ArrayConstructor === 'function') {
		typedArrays.splice(7, 0, ['Float16Array', Float16ArrayConstructor, 1.5, 9.5])
	}

	it.each(typedArrays)('阻止 %s 索引赋值', (_name, Constructor, initial, changed) => {
		const array = new Constructor([initial, initial])
		const target = readonly(array, {
			tip: 'none',
			plugins: [typedArrayReadonlyPlugin]
		})

		target[0] = changed

		expect(Array.from(array)).toEqual([initial, initial])
	})

	it.each(typedArrays)('阻止 %s.fill()', (_name, Constructor, initial, changed) => {
		const array = new Constructor([initial, initial])
		const target = readonly(array, {
			tip: 'none',
			plugins: [typedArrayReadonlyPlugin]
		})

		target.fill(changed)

		expect(Array.from(array)).toEqual([initial, initial])
	})

	it.each(typedArrays)('阻止 %s.set/reverse/sort/copyWithin()', (_name, Constructor, initial, changed) => {
		const array = new Constructor([initial, changed])
		const target = readonly(array, {
			tip: 'none',
			plugins: [typedArrayReadonlyPlugin]
		})

		target.set([changed], 0)
		target.reverse()
		target.sort()
		target.copyWithin(0, 1)

		expect(Array.from(array)).toEqual([initial, changed])
	})

	it.each(typedArrays)('%s 的安全查询和复制方法保持可用', (_name, Constructor, initial, changed) => {
		const array = new Constructor([initial, changed])
		const target = readonly(array, {
			plugins: [typedArrayReadonlyPlugin]
		})

		const sliced = target.slice()
		const mapped = target.map((value: any) => value)
		const reversed = target.toReversed()

		expect(target.at(0)).toBe(initial)
		expect(target.includes(changed)).toBe(true)
		expect(Array.from(target)).toEqual([initial, changed])
		expect(Array.from(sliced)).toEqual([initial, changed])
		expect(Array.from(mapped)).toEqual([initial, changed])
		expect(Array.from(reversed)).toEqual([changed, initial])
		expect(readonly.isReadonly(sliced)).toBe(true)
		expect(readonly.isReadonly(mapped)).toBe(true)
		expect(readonly.isReadonly(reversed)).toBe(true)
	})

	it.runIf(
		typeof (Uint8Array.prototype as any).setFromBase64 === 'function' &&
			typeof (Uint8Array.prototype as any).setFromHex === 'function'
	)('阻止 Uint8Array setFromBase64() 和 setFromHex()', () => {
		const array = new Uint8Array(4)
		const target = readonly(array, {
			tip: 'none',
			plugins: [typedArrayReadonlyPlugin]
		})

		target.setFromBase64('AQIDBA==')
		target.setFromHex('01020304')

		expect(Array.from(array)).toEqual([0, 0, 0, 0])
	})

	it('阻止 Node Buffer 索引、fill、write 和 swap 修改', () => {
		const buffer = Buffer.from([1, 2, 3, 4])
		const target = readonly(buffer, {
			tip: 'none',
			plugins: [typedArrayReadonlyPlugin]
		})

		// @ts-ignore
		target[0] = 9
		target.fill(9)
		target.writeUInt32LE(0)
		target.swap16()

		expect(Array.from(buffer)).toEqual([1, 2, 3, 4])
		expect(target.toString('hex')).toBe('01020304')
	})

	it('subarray() 返回共享底层内存的只读视图', () => {
		const array = new Uint8Array([1, 2, 3, 4])
		const target = readonly(array, {
			tip: 'none',
			plugins: [typedArrayReadonlyPlugin]
		})

		const subarray = target.subarray(1, 3)
		subarray.fill(9)
		// @ts-ignore
		subarray[0] = 9

		expect(readonly.isReadonly(subarray)).toBe(true)
		expect(Array.from(array)).toEqual([1, 2, 3, 4])
	})
})

describe('binaryReadonlyPlugins', () => {
	it('共享缓存保持 TypedArray.buffer 和外层 buffer 的代理身份', () => {
		const buffer = new ArrayBuffer(8, { maxByteLength: 16 })
		const bytes = new Uint8Array(buffer)
		const view = new DataView(buffer)
		const target = readonly(
			{ buffer, bytes, view },
			{
				tip: 'none',
				plugins: binaryReadonlyPlugins
			}
		)

		expect(target.bytes.buffer).toBe(target.buffer)
		expect(target.view.buffer).toBe(target.buffer)

		// @ts-ignore
		target.bytes[0] = 1
		target.view.setUint8(1, 2)
		target.buffer.resize(16)

		expect(Array.from(bytes)).toEqual(new Array(8).fill(0))
		expect(buffer.byteLength).toBe(8)
	})

	it('浅只读仍阻止二进制对象自身修改，但不递归包装返回值', () => {
		const buffer = new ArrayBuffer(8, { maxByteLength: 16 })
		const bytes = new Uint8Array(buffer)
		const target = readonly.shallowReadonly(
			{ buffer, bytes },
			{
				tip: 'none',
				plugins: binaryReadonlyPlugins
			}
		)

		target.buffer.resize(16)
		target.bytes.fill(1)

		expect(target.buffer).toBe(buffer)
		expect(target.bytes).toBe(bytes)
		expect(buffer.byteLength).toBe(16)
		expect(Array.from(bytes)).toEqual(new Array(16).fill(1))
	})

	it('直接浅包装二进制对象时插件会保护对象自身', () => {
		const bytes = new Uint8Array([1, 2, 3])
		const target = readonly.shallowReadonly(bytes, {
			tip: 'none',
			plugins: binaryReadonlyPlugins
		})

		target.fill(9)
		// @ts-ignore
		target[0] = 9

		expect(Array.from(bytes)).toEqual([1, 2, 3])
	})
})
