import { isObject } from '../isObject/index.js'
import { ReadonlyUnDeep, type ReadonlyOptions } from './types/index.js'

export const DEFAULT_SIGN = Symbol('default_sign')
export const READONLY_SIGN = Symbol('readonly_sign')
export const DEEP_READONLY_SIGN = Symbol('deep_readonly_sign')

export const proxyCollection = new WeakMap<
	any,
	{
		isShallowReadonly: boolean
		data: any
		sign: ReadonlyOptions['sign']
		tip: ReadonlyOptions['tip']
	}
>()

/**
 * 判断一个数据是否为浅层只读
 * - 若需判断是否为深层只读应使用 readonly.isDeepReadonly()
 * - 若只需判断是否为只读应使用 readonly.isReadonly()
 * @param target 判断目标
 */
export const isShallowReadonly = (target: any) => {
	if (isObject(target)) {
		return false
	}

	if (target[READONLY_SIGN]) {
		return true
	}
	return false
}

/**
 * 判断一个数据是否为深层只读
 * - 若需判断是否为浅层只读应使用 readonly.isShallowReadonly()
 * - 若只需判断是否为只读应使用 readonly.isReadonly()
 * @param target 判断目标
 */
export const isDeepReadonly = (target: any) => {
	if (isObject(target)) {
		return false
	}

	if (target[DEEP_READONLY_SIGN]) {
		return true
	}
	return false
}

/**
 * 判断一个数据是否为只读
 * - 若需判断是否为浅层只读应使用 readonly.isShallowReadonly()
 * - 若需判断是否为深层只读应使用 readonly.isDeepReadonly()
 * @param target 判断目标
 */
export const isReadonly = (target: any) => {
	if (!isObject(target)) {
		return false
	}

	if (target[READONLY_SIGN] || target[DEEP_READONLY_SIGN]) {
		return true
	}
	return false
}

/**
 * 将一个只读数据转回原始数据
 * - 转换失败将抛出错误
 * @param target 目标
 */
export const toOrigin = <T extends object>(target: T, sign?: any): ReadonlyUnDeep<T> => {
	const info = proxyCollection.get(target)
	if (!info) {
		throw new Error("'target' is not readonly")
	}

	if (sign === DEFAULT_SIGN) {
		return info.data
	}

	if (!Object.is(info.sign, sign)) {
		throw new Error("'sign' is not match")
	}
	return info.data
}

export const tipList = ['error', 'warn', 'none'] as const

/**
 * 获取只读数据的错误提示等级
 * - 获取失败将抛出错误
 * @param target 目标
 */
export const getTip = (target: any): ReadonlyOptions['tip'] => {
	const info = proxyCollection.get(target)
	if (!info) {
		throw new Error("'target' is not readonly")
	}
	return info.tip
}
