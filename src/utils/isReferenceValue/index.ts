import { isArray } from '../isArray/index.js'
import { isObject } from '../isObject/index.js'
import { isFunction } from '../isFunction/index.js'

/**
 * 判断一个数据是否为引用值
 * - array | object | function 类型为引用值
 * - 需要一次性判断多个可以调用 isReferenceValue.all() 辅助方法
 * @param data 需要判断的数据
 * @returns boolean
 */
export const isReferenceValue = (data: any): boolean => {
	return isArray(data) || isObject(data) || isFunction(data)
}

/**
 * 判断传入的所有数据是否都为引用值
 * - array | object | function 类型为引用值
 * - 暂无法触发类型保护
 * @param args 需要判断的数据
 * @returns boolean
 */
isReferenceValue.all = (...args: any[]) => {
	if (args.length === 0) return false
	return args.every(isReferenceValue)
}
