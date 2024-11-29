import shallowReadonly from './createShallowReadonly.js'
import { proxyCollection, isDeepReadonly, isShallowReadonly, isReadonly, toOrigin, SYSTEM_SIGN } from './context.js'
import { isReferenceValue } from '../isReferenceValue/index.js'
import { isFunction } from '../isFunction/index.js'
import { Options } from './types/index.js'

/**
 * 将引用数据包装为一个深层只读引用
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

	const newOptions = {
		sign: Object.hasOwn(options, 'sign') ? options.sign : SYSTEM_SIGN
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
			console.warn(`"target" is readonly, can not set property "${String(p)}" to "${String(newValue)}"`, target)
			return true
		},

		deleteProperty(target, p) {
			console.warn(`"target" is readonly, can not delete property "${String(p)}"`, target)
			return true
		},

		defineProperty(target, property) {
			console.warn(`"target" is readonly, can not define property "${String(property)}"`, target)
			return true
		}
	})
	proxyCollection.set(proxy, {
		data: target,
		isShallowReadonly: false,
		sign: newOptions.sign
	})
	return proxy
}
readonly.shallowReadonly = shallowReadonly
readonly.isDeepReadonly = isDeepReadonly
readonly.isShallowReadonly = isShallowReadonly
readonly.isReadonly = isReadonly
readonly.toOrigin = toOrigin
