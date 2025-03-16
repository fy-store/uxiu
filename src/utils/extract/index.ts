import type { ExtractOptions } from './types/index.js'

/**
 * 提取对象指定字段
 * @param target 目标
 * @param keys 提取的字段数组
 * @param options 配置选项
 * @returns 提取后新的数据
 */
export const extract = <T1 extends object, T2 extends keyof T1>(
	target: T1,
	keys: T2[],
	options?: ExtractOptions
): Pick<T1, T2> => {
	type Data = Pick<T1, T2>
	const data: Data = {} as Data
	const { notValueWriteUndefined = true, containPrototype = true } = options ?? {}
	if (containPrototype) {
		keys.forEach((key) => {
			if (notValueWriteUndefined) {
				data[key] = target[key]
			} else {
				if (key in data) {
					data[key] = target[key]
				}
			}
		})
	} else {
		keys.forEach((key) => {
			if (Object.hasOwn(target, key)) {
				data[key] = target[key]
			} else if (notValueWriteUndefined) {
				data[key] = void 0
			}
		})
	}

	return data
}
