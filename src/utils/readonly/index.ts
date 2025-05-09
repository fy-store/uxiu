import shallowReadonly from './createShallowReadonly.js'
import {
	proxyCollection,
	isDeepReadonly,
	isShallowReadonly,
	isReadonly,
	toOrigin,
	SYSTEM_SIGN,
	tipList,
	getTip
} from './context.js'
import { isReferenceValue } from '../isReferenceValue/index.js'
import { isFunction } from '../isFunction/index.js'
import type { DeepReadonly, Options } from './types/index.js'
import tipMap from './tipMap.js'

/**
 * 将引用数据包装为一个深层只读引用
 * - 如果目标已经是一个浅层只读则会重新解构包装成新的深层只读
 * - 如果目标已经是一个深度只读则直接返回目标
 * @param target 包装目标
 * @param options 配置选项
 */
export const readonly = <T extends Object>(target: T, options: Options = {}): DeepReadonly<T> => {
	if (!isReferenceValue(target)) {
		throw new TypeError(`'target' must be an object, ${String(target)}`)
	}

	if (!isReferenceValue(options)) {
		throw new TypeError(`'options' must be an object, ${String(options)}`)
	}

	const tip = Object.hasOwn(options, 'tip') ? options.tip : 'warn'
	if (!tipList.includes(tip)) {
		throw new TypeError(`'options.tip' must be one of 'error', 'warn', 'none', ${String(options.tip)}`)
	}

	const newOptions = {
		sign: Object.hasOwn(options, 'sign') ? options.sign : SYSTEM_SIGN,
		tip
	}

	if (isDeepReadonly(target)) {
		return target
	}

	if (isShallowReadonly(target)) {
		target = toOrigin(target, SYSTEM_SIGN)
	}

	const proxy = new Proxy(target, {
		get(target, p, receiver) {
			const value = Reflect.get(target, p, receiver)

			if (isFunction(value)) {
				if (p === 'constructor') {
					return value
				}

				return readonly(value, newOptions)
			}

			if (isReferenceValue(value)) {
				return readonly(value, newOptions)
			}

			return value
		},

		set(target, p, newValue) {
			tipMap[newOptions.tip](
				`'target' is readonly, can not set property '${String(p)}' to '${String(newValue)}'`,
				target
			)
			return true
		},

		deleteProperty(target, p) {
			tipMap[newOptions.tip](`'target' is readonly, can not delete property '${String(p)}'`, target)
			return true
		},

		defineProperty(target, property) {
			tipMap[newOptions.tip](`'target' is readonly, can not define property '${String(property)}'`, target)
			return true
		}
	})
	proxyCollection.set(proxy, {
		data: target,
		isShallowReadonly: false,
		sign: newOptions.sign,
		tip: newOptions.tip
	})
	return proxy
}

/**
 * 将引用数据包装为一个浅层只读引用
 * - 如果目标已经是一个只读数据了则直接返回目标
 * @param target 包装目标
 * @param options 配置选项
 */
readonly.shallowReadonly = shallowReadonly

/**
 * 判断一个数据是否为深层只读
 * - 若需判断是否为浅层只读应使用 readonly.isShallowReadonly()
 * - 若只需判断是否为只读应使用 readonly.isReadonly()
 * @param target 判断目标
 */
readonly.isDeepReadonly = isDeepReadonly

/**
 * 判断一个数据是否为浅层只读
 * - 若需判断是否为深层只读应使用 readonly.isDeepReadonly()
 * - 若只需判断是否为只读应使用 readonly.isReadonly()
 * @param target 判断目标
 */
readonly.isShallowReadonly = isShallowReadonly

/**
 * 判断一个数据是否为只读
 * - 若需判断是否为浅层只读应使用 readonly.isShallowReadonly()
 * - 若需判断是否为深层只读应使用 readonly.isDeepReadonly()
 * @param target 判断目标
 */
readonly.isReadonly = isReadonly

/**
 * 将一个只读数据转回原始数据
 * - 转换失败将抛出错误
 * @param target 目标
 */
readonly.toOrigin = toOrigin

/**
 * 获取只读数据的错误提示等级
 * - 获取失败将抛出错误
 * @param target 目标
 */
readonly.getTip = getTip
