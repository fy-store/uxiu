import { isReferenceValue } from '../isReferenceValue/index.js'

/**
 * 判断一个数据是否为原始值
 * - 除 array | object | function 类型外的数据
 * - 需要一次性判断多个可以调用 isOriginValue.all() 辅助方法
 * @param data 需要判断的数据
 * @returns boolean
 */
export const isOriginValue = (data: any): boolean => {
	return !isReferenceValue(data)
}

/**
 * 判断传入的所有数据是否都为引用值
 * - 除 array | object | function 类型外的数据
 * - 暂无法触发类型保护
 * @param args 需要判断的数据
 * @returns boolean
 */
isOriginValue.all = (...args: any[]) => {
	return args.every(isOriginValue)
}
