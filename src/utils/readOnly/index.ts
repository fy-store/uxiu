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
import { type Options } from './types/index.js'
import tipMap from './tipMap.js'

/**
 * 将引用数据包装为一个深层只读引用
 * - 如果目标已经是一个浅层只读则会重新解构包装成新的深层只读
 * - 如果目标已经是一个深度只读则直接返回目标
 * @param target 包装目标
 * @param options 配置选项
 */
export const readonly = <T extends Object>(target: T, options: Options = {}) => {
	if (!isReferenceValue(target)) {
		throw new TypeError(`"target" must be an object, ${String(target)}`)
	}

	if (!isReferenceValue(options)) {
		throw new TypeError(`"options" must be an object, ${String(options)}`)
	}

	const tip = Object.hasOwn(options, 'tip') ? (options.tip) : 'warn'
	if (!tipList.includes(tip)) {
		throw new TypeError(`"options.tip" must be one of "error", "warn", "none", ${String(options.tip)}`)
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
				`"target" is readonly, can not set property "${String(p)}" to "${String(newValue)}"`,
				target
			)
			return true
		},

		deleteProperty(target, p) {
			tipMap[newOptions.tip](`"target" is readonly, can not delete property "${String(p)}"`, target)
			return true
		},

		defineProperty(target, property) {
			tipMap[newOptions.tip](`"target" is readonly, can not define property "${String(property)}"`, target)
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
readonly.shallowReadonly = shallowReadonly
readonly.isDeepReadonly = isDeepReadonly
readonly.isShallowReadonly = isShallowReadonly
readonly.isReadonly = isReadonly
readonly.toOrigin = toOrigin
readonly.getTip = getTip
