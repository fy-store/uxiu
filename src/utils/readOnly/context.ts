import { type Options } from './types/index.js'

export const SYSTEM_SIGN = Symbol('systemSign')
export const proxyCollection = new WeakMap<
	any,
	{
		isShallowReadonly: boolean
		data: any
		sign: Options['sign']
		tip: Options['tip']
	}
>()

/**
 * 判断一个数据是否为浅层只读
 * - 若需判断是否为深层只读应使用 readonly.isDeepReadonly()
 * - 若只需判断是否为只读应使用 readonly.isReadonly()
 * @param target 判断目标
 */
export const isShallowReadonly = (target: any) => {
	const info = proxyCollection.get(target)
	if (!info) return false
	return proxyCollection.get(target)?.isShallowReadonly
}

/**
 * 判断一个数据是否为深层只读
 * - 若需判断是否为浅层只读应使用 readonly.isShallowReadonly()
 * - 若只需判断是否为只读应使用 readonly.isReadonly()
 * @param target 判断目标
 */
export const isDeepReadonly = (target: any) => {
	const info = proxyCollection.get(target)
	if (!info) return false
	return !proxyCollection.get(target)?.isShallowReadonly
}

/**
 * 判断一个数据是否为只读
 * - 若需判断是否为浅层只读应使用 readonly.isShallowReadonly()
 * - 若需判断是否为深层只读应使用 readonly.isDeepReadonly()
 * @param target 判断目标
 */
export const isReadonly = (target: any) => {
	return !!proxyCollection.get(target)
}

/**
 * 将一个只读数据转回原始数据
 * - 转换失败将抛出错误
 * @param target 目标
 */
export const toOrigin = <T extends object>(target: T, sign?: any): T => {
	const info = proxyCollection.get(target)
	if (!info) {
		throw new Error('"target" is not readonly')
	}

	if (sign === SYSTEM_SIGN) {
		return info.data
	}

	if (!Object.is(info.sign, sign)) {
		throw new Error('"sign" is not match')
	}
	return info.data
}

export const tipList = ['error', 'warn', 'none']

/**
 * 获取只读数据的错误提示等级
 * - 获取失败将抛出错误
 * @param target 目标
 */
export const getTip = (target: any): Options['tip'] => {
	const info = proxyCollection.get(target)
	if (!info) {
		throw new Error('"target" is not readonly')
	}
	return info.tip
}
