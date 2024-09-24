/**
 * 判断一个数据是否为 boolean
 * - 需要一次性判断多个可以调用 isBoolean.all() 辅助方法
 * @param data 需要判断的数据
 * @returns boolean
 */
export const isBoolean = (data: any): data is boolean => {
	return typeof data === 'boolean'
}

/**
 * 判断传入的所有数据是否都为 boolean
 * - 暂无法触发类型保护
 * @param args 需要判断的数据
 * @returns boolean
 */
isBoolean.all = (...args: any[]) => {
	if (args.length === 0) return false
	return args.every(isBoolean)
}
