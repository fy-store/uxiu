export type IsObject = {
	[key: string | symbol]: any
}

/**
 * 判断一个数据是否为对象
 * - 需要一次性判断多个可以调用 isObject.all() 辅助方法
 * - 需要触发类型保护可以传入泛型
 * @param data 需要判断的数据
 * @returns boolean
 */
export const isObject = <T = IsObject>(data: any): data is T => {
	return typeof data === 'object' && data !== null && !Array.isArray(data)
}

/**
 * 判断传入的所有数据是否都为对象
 * - 暂无法触发类型保护
 * @param args 需要判断的数据
 * @returns boolean
 */
isObject.all = (...args: any[]) => {
	if (args.length === 0) return false
	return args.every(isObject)
}
