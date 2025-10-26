/**
 * 剔除指定对象字段
 * - 不改变原对象数据
 * - 需要影响原数据可以使用 omit.effect() 方法
 * @param target 目标
 * @param keys 剔除的字段数组
 * @returns 剔除后新的对象
 */
export function omit<T1 extends object, T2 extends (keyof T1)[]>(target: T1, keys: T2): Omit<T1, T2[number]> {
	const data = { ...target }
	keys.forEach((key) => delete data[key])
	return data
}

/**
 * 剔除指定对象字段
 * - 会改变原对象数据
 * @param target 目标
 * @param keys 剔除的字段数组
 * @returns 改变后的原对象
 */
omit.effect = function <T1 extends object, T2 extends (keyof T1)[]>(target: T1, keys: T2): Omit<T1, T2[number]> {
	keys.forEach((key) => delete target[key])
	return target
}
