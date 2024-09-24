/**
 * 判断一个数据是否为 null
 * - 需要一次性判断多个可以调用 isNull.all() 辅助方法
 * @param data 需要判断的数据
 * @returns boolean
 */
export const isNull = (data: any): data is null => {
	return data === null
}

/**
 * 判断传入的所有数据是否都为 null
 * - 暂无法触发类型保护
 * @param args 需要判断的数据
 * @returns boolean
 */
isNull.all = (...args: any[]) => {
	if (args.length === 0) return false
	return args.every(isNull)
}
