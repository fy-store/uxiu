import { isUndefined } from '../isUndefined/index.js'
import { isNull } from '../isNull/index.js'

/**
 * 判断一个数据是否为 undefind 或 null
 * - 需要一次性判断多个可以调用 isEmpty.all() 辅助方法
 * @param data 需要判断的数据
 * @returns boolean
 */
export const isEmpty = (data: any): data is boolean => {
	return isUndefined(data) || isNull(data)
}

/**
 * 判断传入的所有数据是否都为 undefind 或 null
 * - 未传递任何数据将返回 true
 * - 暂无法触发类型保护
 * @param args 需要判断的数据
 * @returns boolean
 */
isEmpty.all = (...args: any[]) => {
	if (args.length === 0) return true
	return args.every(isEmpty)
}
