import tipMap from './tipMap.js'
import weakMap from './weakMap.js'
import { isOriginValue } from '../isOriginValue/index.js'
import { type Options } from './types/index.js'

/** 通用模式 */
export const currency = <T extends object>(data: T, tip: Options['tip']): T => {
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
				return currency(value.bind(target), tip)
			}

			return currency(value, tip)
		},

		set(target) {
			log(target)
			return true
		},

		deleteProperty(target) {
			log(target)
			return true
		},

		defineProperty(target) {
			log(target)
			return true
		}
	})

	weakMap.set(p, {})
	return p
}

const errorProxy = new Proxy(
	{},
	{
		get(target, p, receiver) {
			throw new Error(
				'The current data configuration "options.mode" is "default" , cannot be changed data through "this" !'
			)
		}
	}
)

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
				return limitedThis(
					value.bind(
						new Proxy(
							{},
							{
								get(target, p, receiver) {
									log(p)
									throw new Error(
										'The current data configuration "options.mode" is "limitedThis" , cannot be use "this" !'
									)
								}
							}
						)
					),
					tip
				)
			}

			return limitedThis(value, tip)
		},

		set(target) {
			log(target)
			return true
		},

		deleteProperty(target) {
			log(target)
			return true
		},

		defineProperty(target) {
			log(target)
			return true
		}

		// apply(target, thisArg, argArray) {
		// 	return Reflect.apply(target as any, thisArg, argArray)
		// }
	})

	weakMap.set(p, {})
	return p
}
