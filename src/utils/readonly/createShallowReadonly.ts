import type { ShallowReadonlyOptions, ReadonlyContext } from './types/index.js'
import { proxyCollection, isReadonly, toOrigin, DEFAULT_SIGN, tipList, CONTEXT_SIGN, isApply } from './context.js'
import { isReferenceValue } from '../isReferenceValue/index.js'
import tipMap from './tipMap.js'

/**
 * 将引用数据包装为一个浅层只读引用
 * - 如果目标已经是一个只读数据了则直接返回目标(深度只读不会降级为浅层只读)
 * @param target 包装目标
 * @param options 配置选项
 */
export default function <T extends Object>(target: T, options: ShallowReadonlyOptions = {}): Readonly<T> {
	if (!isReferenceValue(target)) {
		throw new TypeError(`'target' must be an object, ${String(target)}`)
	}

	if (!isReferenceValue(options)) {
		throw new TypeError(`'options' must be an object, ${String(options)}`)
	}

	const tip = Object.hasOwn(options, 'tip') ? options.tip : 'warn'
	if (!tipList.includes(tip as Required<ShallowReadonlyOptions>['tip'])) {
		throw new TypeError(`'options.tip' must be one of 'error', 'warn', 'none', ${String(options.tip)}`)
	}

	// 代理上下文信息
	const context: ReadonlyContext = {
		tip: tip!,
		sign: Object.hasOwn(options, 'sign') ? options.sign : DEFAULT_SIGN,
		data: target,
		isShallowReadonly: true,
		proxyFunction: Object.hasOwn(options, 'proxyFunction') ? Boolean(options.proxyFunction) : true
	}

	// 如果已经是只读则直接返回
	if (isReadonly(target)) {
		return target as Readonly<T>
	}

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
				} else if (typeof value === 'function' && context.proxyFunction) {
					return new Proxy(value, {
						apply(target: any, thisArg, argArray) {
							if (options.applyHandler) {
								return options.applyHandler(target, thisArg, argArray, context)
							} else if (isApply(thisArg, target)) {
								return Array.isArray(thisArg)
									? Reflect.apply(target, thisArg, argArray)
									: Reflect.apply(target, proxyCollection.get(thisArg)?.data ?? thisArg, argArray)
							} else {
								tipMap[context.tip](
									`'target' is readonly, can not call method '${String(target.name)}'`,
									target
								)
							}
						}
					})
				}
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
		isShallowReadonly: true,
		proxyFunction: context.proxyFunction,
		sign: context.sign,
		tip: context.tip
	})
	return proxy as Readonly<T>
}
