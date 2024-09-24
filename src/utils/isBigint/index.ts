/**
 * 判断一个数据是否为 bigint
 * - 需要一次性判断多个可以调用 isBigint.all() 辅助方法
 * @param data 需要判断的数据
 * @returns bigint
 */
export const isBigint = (data: any): data is bigint => {
	return typeof data === 'bigint'
}

/**
 * 判断传入的所有数据是否都为 bigint
 * - 暂无法触发类型保护
 * @param args 需要判断的数据
 * @returns bigint
 */
isBigint.all = (...args: any[]) => {
	if (args.length === 0) return false
	return args.every(isBigint)
}
