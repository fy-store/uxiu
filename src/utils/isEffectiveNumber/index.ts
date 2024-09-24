import { isNumber } from '../isNumber/index.js'

/**
 * 判断一个数据是否为有效的 number
 * - NaN 和 Infinity 和 -Infinity 被认定为 false
 * - bigint 类型被认定为 false
 * - 需要一次性判断多个可以调用 isEffectiveNumber.all() 辅助方法
 * @param data 需要判断的数据
 * @returns boolean
 */
export const isEffectiveNumber = (data: any): data is number => {
	if (!isNumber(data) || Number.isNaN(data) || data === Infinity || data === -Infinity) return false
	return true
}

/**
 * 判断传入的所有数据是否都为有效的 number
 * - NaN 和 Infinity 和 -Infinity 被认定为 false
 * - bigint 类型被认定为 false
 * - 暂无法触发类型保护
 * @param args 需要判断的数据
 * @returns boolean
 */
isEffectiveNumber.all = (...args: any[]) => {
	if (args.length === 0) return false
	return args.every(isEffectiveNumber)
}
