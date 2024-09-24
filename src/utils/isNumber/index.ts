/**
 * 判断一个数据是否为 number
 * - 需要一次性判断多个可以调用 isNumber.all() 辅助方法
 * @param data 需要判断的数据
 * @returns boolean
 */
export const isNumber = (data: any): data is number => {
	return typeof data === 'number'
}

/**
 * 判断传入的所有数据是否都为 number
 * - 暂无法触发类型保护
 * @param args 需要判断的数据
 * @returns boolean
 */
isNumber.all = (...args: any[]) => {
	if (args.length === 0) return false
	return args.every(isNumber)
}
