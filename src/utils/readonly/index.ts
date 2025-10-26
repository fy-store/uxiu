import type { ReadonlyDeep, ReadonlyOptions, ReadonlyContext } from './types/index.js'
import shallowReadonly from './createShallowReadonly.js'
import {
	proxyCollection,
	isDeepReadonly,
	isShallowReadonly,
	isReadonly,
	toOrigin,
	DEFAULT_SIGN,
	tipList,
	getTip,
	CONTEXT_SIGN,
	isApply
} from './context.js'
import { isReferenceValue } from '../isReferenceValue/index.js'
import tipMap from './tipMap.js'
export * from './types/index.js'

/**
 * 将引用数据包装为一个深层只读引用
 * - 该方法目前还不是一个稳定的 API, 请谨慎使用
 * - 如果目标已经是一个浅层只读则会重新解构包装成新的深层只读
 * - 如果目标已经是一个深度只读则直接返回目标
 * @param target 包装目标
 * @param options 配置选项
 */
export function readonly<T extends Object>(target: T, options: ReadonlyOptions = {}): ReadonlyDeep<T> {
	if (!isReferenceValue(target)) {
		throw new TypeError(`'target' must be an object, ${String(target)}`)
	}

	if (!isReferenceValue(options)) {
		throw new TypeError(`'options' must be an object, ${String(options)}`)
	}

	const tip = Object.hasOwn(options, 'tip') ? options.tip : 'warn'
	if (!tipList.includes(tip as Required<ReadonlyOptions>['tip'])) {
		throw new TypeError(`'options.tip' must be one of 'error', 'warn', 'none', ${String(options.tip)}`)
	}

	// 代理上下文信息
	const context: ReadonlyContext = {
		tip: tip!,
		sign: Object.hasOwn(options, 'sign') ? options.sign : DEFAULT_SIGN,
		data: target,
		isShallowReadonly: false,
		proxyFunction: true
	}

	// 如果已经是深度只读则直接返回
	if (isDeepReadonly(target)) {
		return target as ReadonlyDeep<T>
	}

	// 如果是浅层只读则先转回原始数据
	if (isShallowReadonly(target)) {
		target = toOrigin(target, DEFAULT_SIGN) as T
	}

	// 处理循环引用
	const weakMap = new WeakMap()
	const proxy: T = new Proxy(target, {
		get(target, p, receiver) {
			// 获取代理上下文
			if (p === CONTEXT_SIGN) {
				return context
			}

			const value = Reflect.get(target, p, isReadonly(receiver) ? toOrigin(receiver, DEFAULT_SIGN) : receiver)
			if (isReferenceValue(value)) {
				if (p === '__proto__' || p === 'prototype') {
					return value
				} else if (typeof value === 'function' && p === 'constructor') {
					return value
				}

				// 循环引用
				const data = weakMap.get(value as object)
				if (data) {
					return data
				}
				// 非循环引用
				const newReadonly = readonly(value as T, { sign: context.sign, tip: context.tip })
				weakMap.set(value as object, newReadonly)
				proxyCollection.set(newReadonly, {
					data: value,
					isShallowReadonly: false,
					proxyFunction: true,
					sign: context.sign,
					tip: context.tip
				})
				return newReadonly
			}

			return value
		},

		set(target, p, newValue) {
			if (options.setHandler) {
				return options.setHandler(target, p, newValue, proxy, context)
			}
			tipMap[context.tip](
				`'target' is readonly, can not set property '${String(p)}' to '${String(newValue)}'`,
				target
			)
			return true
		},

		apply(target: any, thisArg, argArray) {
			if (options.applyHandler) {
				return options.applyHandler(target, thisArg, argArray, context)
			} else if (isApply(thisArg, target)) {
				return Array.isArray(thisArg)
					? Reflect.apply(target, thisArg, argArray)
					: Reflect.apply(target, proxyCollection.get(thisArg)?.data ?? thisArg, argArray)
			} else {
				tipMap[context.tip](`'target' is readonly, can not call method '${String(target.name)}'`, target)
			}
		},

		construct(target: any, argArray, newTarget) {
			return Reflect.construct(target, argArray, proxyCollection.get(newTarget)?.data ?? newTarget)
			// return readonly(
			// 	Reflect.construct(target as any, argArray, proxyCollection.get(newTarget)?.data ?? newTarget),
			// 	{
			// 		sign: context.sign,
			// 		tip: context.tip
			// 	}
			// )
		},

		deleteProperty(target, p) {
			tipMap[context.tip](`'target' is readonly, can not delete property '${String(p)}'`, target)
			return true
		},

		defineProperty(target, property) {
			tipMap[context.tip](`'target' is readonly, can not define property '${String(property)}'`, target)
			return true
		}
	})
	proxyCollection.set(proxy, {
		data: target,
		isShallowReadonly: false,
		proxyFunction: true,
		sign: context.sign,
		tip: context.tip
	})
	return proxy as ReadonlyDeep<T>
}

/**
 * 将引用数据包装为一个浅层只读引用
 * - 如果目标已经是一个只读数据了则直接返回目标(深度只读不会降级为浅层只读)
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
 * - 获取失败将返回 undefined
 * @param target 目标
 */
readonly.getTip = getTip
