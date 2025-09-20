import { isReferenceValue } from '../isReferenceValue/index.js'
import { proxyCollection, isReadonly, DEFAULT_SIGN, tipList, READONLY_SIGN } from './context.js'
import { type ReadonlyOptions } from './types/index.js'
import tipMap from './tipMap.js'

/**
 * 将引用数据包装为一个浅层只读引用
 * - 如果目标已经是一个只读数据了则直接返回目标
 * @param target 包装目标
 * @param options 配置选项
 */
export default <T extends Object>(target: T, options: ReadonlyOptions = {}): Readonly<T> => {
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
	if (!tipList.includes(tip as Required<ReadonlyOptions>['tip'])) {
		throw new TypeError(`'options.tip' must be one of 'error', 'warn', 'none', ${String(options.tip)}`)
	}
	const newOptions = {
		sign: Object.hasOwn(options, 'sign') ? options.sign : DEFAULT_SIGN,
		tip
	} as Required<ReadonlyOptions>

	const proxy = new Proxy(target, {
		get(target, p, receiver) {
			if (p === READONLY_SIGN) {
				return true
			}
			const value = Reflect.get(target, p, receiver)
			// 修复 Date 在被代理后 JSON 序列化报错的问题
			if (target instanceof Date && p === 'toJSON' && typeof value === 'function') {
				return value.bind(target)
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
		isShallowReadonly: true,
		data: target,
		sign: newOptions.sign,
		tip: newOptions.tip
	})
	return proxy
}
