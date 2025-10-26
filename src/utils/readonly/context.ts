import { ReadonlyContext, ReadonlyUnDeep, type ReadonlyOptions } from './types/index.js'

export const DEFAULT_SIGN = Symbol('default_sign')
export const CONTEXT_SIGN = Symbol('readonly_context_sign')

/** 数据代理集合 */
export const proxyCollection = new WeakMap<any, ReadonlyContext>()

/** 获取代理上下文信息 */
export function getContext<T = any>(target: any): ReadonlyContext<T> | undefined {
	return target?.[CONTEXT_SIGN]
}

/**
 * 判断一个数据是否为浅层只读
 * - 若需判断是否为深层只读应使用 readonly.isDeepReadonly()
 * - 若只需判断是否为只读应使用 readonly.isReadonly()
 * @param target 判断目标
 */
export function isShallowReadonly(target: any): boolean {
	const context = getContext(target)
	if (!context) {
		return false
	}

	return context.isShallowReadonly
}

/**
 * 判断一个数据是否为深层只读
 * - 若需判断是否为浅层只读应使用 readonly.isShallowReadonly()
 * - 若只需判断是否为只读应使用 readonly.isReadonly()
 * @param target 判断目标
 */
export function isDeepReadonly(target: any): boolean {
	const context = getContext(target)
	if (!context) {
		return false
	}

	return !context.isShallowReadonly
}

/**
 * 判断一个数据是否为只读
 * - 若需判断是否为浅层只读应使用 readonly.isShallowReadonly()
 * - 若需判断是否为深层只读应使用 readonly.isDeepReadonly()
 * @param target 判断目标
 */
export function isReadonly(target: any): boolean {
	const context = getContext(target)
	if (!context) {
		return false
	}
	return true
}

/**
 * 将一个只读数据转回原始数据
 * - 转换失败将抛出错误
 * @param target 目标
 */
export function toOrigin<T extends object>(target: T, sign?: any): ReadonlyUnDeep<T> {
	const context = getContext(target)
	if (!context) {
		throw new Error("'target' is not readonly")
	}

	if (sign === DEFAULT_SIGN) {
		return context.data
	}

	if (!Object.is(context.sign, sign)) {
		throw new Error("'sign' is not match")
	}
	return context.data
}

export const tipList = ['error', 'warn', 'none'] as const
export const arrayQueryVerifyFunctions = [
	'includes',
	'indexOf',
	'lastIndexOf',
	'find',
	'findIndex',
	'filter',
	'some',
	'every',
	'flatMap'
]

export const arrayDisabled = ['push', 'pop', 'shift', 'unshift', 'splice']
export const mapDisabled = ['set', 'delete', 'clear']
export const setDisabled = ['add', 'delete', 'clear']
export const weakMapDisabled = ['set', 'delete']
export const weakSetDisabled = ['add', 'delete']
export const dateDisabled = [
	'setDate',
	'setFullYear',
	'setHours',
	'setMilliseconds',
	'setMinutes',
	'setMonth',
	'setSeconds',
	'setTime',
	'setUTCDate',
	'setUTCFullYear',
	'setUTCHours',
	'setUTCMilliseconds',
	'setUTCMinutes',
	'setUTCMonth',
	'setUTCSeconds',
	'setYear'
]
export const arrayBufferDisabled = ['resize']
// bufView = TypedArray + DataView
export const bufViewDisabled = [
	'setInt8',
	'setUint8',
	'setInt16',
	'setUint16',
	'setInt32',
	'setUint32',
	'setFloat32',
	'setFloat64',
	'set',
	'copyWithin',
	'fill',
	'reverse',
	'sort'
]

/**
 * 判断此数据上的该函数是否可调用
 * @param thisTarget 目标数据
 * @param target 方法
 */
export function isApply(thisTarget: any, target: (...args: any[]) => any): boolean {
	if (Array.isArray(thisTarget) && arrayDisabled.includes(target.name)) {
		return false
	} else if (thisTarget instanceof Map && mapDisabled.includes(target.name)) {
		return false
	} else if (thisTarget instanceof Set && setDisabled.includes(target.name)) {
		return false
	} else if (thisTarget instanceof Date && dateDisabled.includes(target.name)) {
		return false
	} else if (thisTarget instanceof WeakMap && weakMapDisabled.includes(target.name)) {
		return false
	} else if (thisTarget instanceof WeakSet && weakSetDisabled.includes(target.name)) {
		return false
	} else if (thisTarget instanceof ArrayBuffer && arrayBufferDisabled.includes(target.name)) {
		return false
	} else if (ArrayBuffer.isView(thisTarget) && bufViewDisabled.includes(target.name)) {
		return false
	}

	return true
}

/**
 * 获取只读数据的错误提示等级
 * - 获取失败将返回 undefined
 * @param target 目标
 */
export function getTip(target: any): ReadonlyOptions['tip'] {
	const context = getContext(target)
	return context?.tip
}
