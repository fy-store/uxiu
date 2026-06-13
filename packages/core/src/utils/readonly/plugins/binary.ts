import { createReadonlyMethodPlugin } from './createMethodPlugin.js'

type BufferLike = ArrayBuffer | SharedArrayBuffer
type TypedArray =
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float16Array
	| Float32Array
	| Float64Array
	| BigInt64Array
	| BigUint64Array

const arrayBufferMutationMethods = ['resize', 'transfer', 'transferToFixedLength', 'grow'] as const

const dataViewMutationMethods = [
	'setInt8',
	'setUint8',
	'setInt16',
	'setUint16',
	'setInt32',
	'setUint32',
	'setFloat16',
	'setFloat32',
	'setFloat64',
	'setBigInt64',
	'setBigUint64'
] as const

const typedArrayMutationMethods = [
	'copyWithin',
	'fill',
	'reverse',
	'set',
	'sort',
	'setFromBase64',
	'setFromHex',
	'write',
	'writeBigInt64BE',
	'writeBigInt64LE',
	'writeBigUInt64BE',
	'writeBigUInt64LE',
	'writeDoubleBE',
	'writeDoubleLE',
	'writeFloatBE',
	'writeFloatLE',
	'writeInt8',
	'writeInt16BE',
	'writeInt16LE',
	'writeInt32BE',
	'writeInt32LE',
	'writeIntBE',
	'writeIntLE',
	'writeUInt8',
	'writeUInt16BE',
	'writeUInt16LE',
	'writeUInt32BE',
	'writeUInt32LE',
	'writeUIntBE',
	'writeUIntLE',
	'swap16',
	'swap32',
	'swap64'
] as const

function isBufferLike(target: object): target is BufferLike {
	return (
		target instanceof ArrayBuffer ||
		(typeof SharedArrayBuffer !== 'undefined' && target instanceof SharedArrayBuffer)
	)
}

function isTypedArray(target: object): target is TypedArray {
	return ArrayBuffer.isView(target) && !(target instanceof DataView)
}

/** 阻止 ArrayBuffer resize/transfer 和 SharedArrayBuffer grow */
export const arrayBufferReadonlyPlugin = createReadonlyMethodPlugin<BufferLike>({
	name: 'array-buffer',
	match: isBufferLike,
	methods: arrayBufferMutationMethods
})

/** 阻止 DataView 的所有 set* 写入方法 */
export const dataViewReadonlyPlugin = createReadonlyMethodPlugin<DataView>({
	name: 'data-view',
	match: (target): target is DataView => target instanceof DataView,
	methods: dataViewMutationMethods
})

/** 阻止 TypedArray 和 Node Buffer 的原地修改方法 */
export const typedArrayReadonlyPlugin = createReadonlyMethodPlugin<TypedArray>({
	name: 'typed-array',
	match: isTypedArray,
	methods: typedArrayMutationMethods
})

/** 完整保护二进制缓冲区、DataView 和 TypedArray */
export const binaryReadonlyPlugins = [
	arrayBufferReadonlyPlugin,
	dataViewReadonlyPlugin,
	typedArrayReadonlyPlugin
] as const
