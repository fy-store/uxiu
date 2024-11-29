import { isReferenceValue } from '../isReferenceValue/index.js'
import { proxyCollection, isReadonly, SYSTEM_SIGN } from './context.js'
import { Options } from './types/index.js'

/**
 * 将引用数据包装为一个浅层只读引用
 * @param target 包装目标
 * @param options 配置选项
 */
export default <T extends Object>(target: T, options: Options = {}) => {
	if (!isReferenceValue(target)) {
		throw new TypeError(`"target" must be an object, ${String(target)}`)
	}

	if (!isReferenceValue(options)) {
		throw new TypeError(`"options" must be an object, ${String(options)}`)
	}

	if (isReadonly(target)) {
		return target
	}

	const newOptions = {
		sign: Object.hasOwn(options, 'sign') ? options.sign : SYSTEM_SIGN
	}

	const proxy = new Proxy(target, {
		get(target, p, receiver) {
			return Reflect.get(target, p, receiver)
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
		isShallowReadonly: true,
		data: target,
		sign: newOptions.sign
	})
	return proxy
}
