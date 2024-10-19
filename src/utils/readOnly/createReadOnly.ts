import tipMap from './tipMap.js'
import weakMap from './weakMap.js'
import { isOriginValue } from '../isOriginValue/index.js'
import { type Options } from './types/index.js'

/** 通用模式 */
export const currency = <T extends object>(data: T, tip: Options['tip']): T => {
	const log = tipMap[tip]
	const p = new Proxy(data, {
		get(target, p, receiver) {
			// const value = target[p]
			const value = Reflect.get(target, p, receiver)
			// 原始值直接返回
			if (isOriginValue(value)) {
				return value
				// return Reflect.get(target, p, receiver)
			}

			// 解决原型问题
			if (typeof value === 'function') {
				return new Proxy(value, {
					get(target, p, receiver) {
						const v = Reflect.get(target, p, receiver)
						if (p === 'prototype') {
							return v
						}
						if (isOriginValue(v)) {
							return v
						}
						return currency(v as object, tip)
					},

					set(target, p) {
						log(target, `is read only , cannot set ${String(p)} !`)
						return true
					},

					deleteProperty(target, p) {
						log(target, `is read only , cannot delete ${String(p)} !`)
						return true
					},

					defineProperty(target, p) {
						log(target, `is read only , cannot defineProperty ${String(p)} !`)
						return true
					}
				})
			}

			return currency(value as object, tip)
		},

		set(target, p) {
			log(target, `is read only , cannot set ${String(p)} !`)
			return true
		},

		deleteProperty(target, p) {
			log(target, `is read only , cannot delete ${String(p)} !`)
			return true
		},

		defineProperty(target, p) {
			log(target, `is read only , cannot defineProperty ${String(p)} !`)
			return true
		}
	})

	weakMap.set(p, {})
	return p
}

/** 限制方法 this 模式 */
export const limitedThis = <T extends object>(data: T, tip: Options['tip']): T => {
	const log = tipMap[tip]
	const p = new Proxy(data, {
		get(target, p, receiver) {
			const value = target[p]
			// 原始值直接返回
			if (isOriginValue(value)) {
				return Reflect.get(target, p, receiver)
			}

			// 解决原型问题
			if (typeof value === 'function') {
				console.log(value)
				return limitedThis(value.bind({}), tip)
				return limitedThis(
					value.bind(
						new Proxy(value, {
							get(newTarget, p) {
								// const prototype = Object.getPrototypeOf(target)
								log(
									target,
									`The current data configuration "options.mode" is "limitedThis" , cannot be use "this" , .${
										value?.name ?? value
									}() cannot use "this.${String(p)}" !`
								)
								return 2
							},

							set(target, p) {
								console.log('set')
								log(target, `is read only , cannot set ${String(p)} !`)
								return true
							},

							deleteProperty(target) {
								log(target, `is read only , cannot delete ${String(p)} !`)
								return true
							},

							defineProperty(target) {
								log(target, `is read only , cannot defineProperty ${String(p)} !`)
								return true
							}
						})
					),
					tip
				)
			}

			return limitedThis(value, tip)
		},

		set(target, p) {
			log(target, `is read only , cannot set ${String(p)} !`)
			return true
		},

		deleteProperty(target) {
			log(target, `is read only , cannot delete ${String(p)} !`)
			return true
		},

		defineProperty(target) {
			log(target, `is read only , cannot defineProperty ${String(p)} !`)
			return true
		}

		// apply(target, thisArg, argArray) {
		// 	return Reflect.apply(target as any, thisArg, argArray)
		// }
	})

	weakMap.set(p, {})
	return p
}
