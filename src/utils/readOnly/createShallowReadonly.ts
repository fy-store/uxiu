import { isReferenceValue } from '../isReferenceValue/index.js'
import { proxyCollection, isReadonly, SYSTEM_SIGN, tipList } from './context.js'
import { type Options } from './types/index.js'
import tipMap from './tipMap.js'

/**
 * 将引用数据包装为一个浅层只读引用
 * - 如果目标已经是一个只读数据了则直接返回目标
 * @param target 包装目标
 * @param options 配置选项
 */
export default <T extends Object>(target: T, options: Options = {}): Readonly<T> => {
	if (!isReferenceValue(target)) {
		throw new TypeError(`'target' must be an object, ${String(target)}`)
	}

	if (!isReferenceValue(options)) {
		throw new TypeError(`'options' must be an object, ${String(options)}`)
	}

	if (isReadonly(target)) {
		return target
	}

	const tip = Object.hasOwn(options, 'tip') ? options.tip : 'warn'
	if (!tipList.includes(tip)) {
		throw new TypeError(`'options.tip' must be one of 'error', 'warn', 'none', ${String(options.tip)}`)
	}
	const newOptions = {
		sign: Object.hasOwn(options, 'sign') ? options.sign : SYSTEM_SIGN,
		tip
	}

	const proxy = new Proxy(target, {
		get(target, p, receiver) {
			return Reflect.get(target, p, receiver)
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
		isShallowReadonly: true,
		data: target,
		sign: newOptions.sign,
		tip: newOptions.tip
	})
	return proxy
}
