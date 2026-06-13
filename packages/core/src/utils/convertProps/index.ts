import type { ConvertPropsTarget, ConvertPropsProps } from './types.js'
export type * from './types.js'

/**
 * 映射对象属性重新赋值(不改变源对象)
 * - 改变后新的对象, 若需要直接操作原对象可使用 convertProps.effect() 方法
 * @param target 目标
 * @param props 属性配置
 */
export function convertProps<T1 extends object, T2 extends Record<string, any>>(
	target: T1,
	props: { [k in keyof T1]?: (value: T1[k]) => any } | T2
): ConvertPropsTarget<T1, T2> & ConvertPropsProps<T2> {
	const newObj: any = { ...target }
	const keys = Object.keys(props)
	keys.forEach((k) => {
		const callback = props[k as keyof typeof props]
		if (typeof callback === 'function') {
			newObj[k] = callback(target[k as keyof T1])
		} else {
			newObj[k] = props[k as keyof typeof props]
		}
	})
	return newObj
}

/**
 * 映射对象属性重新赋值(改变源对象)
 * - 改变后的对象
 * @param target 目标
 * @param props 属性配置
 */
convertProps.effect = function <T1 extends object, T2 extends Record<string, any>>(
	target: T1,
	props: { [k in keyof T1]?: (value: T1[k]) => any } | T2
): ConvertPropsTarget<T1, T2> & ConvertPropsProps<T2> {
	const newObj: any = target
	const keys = Object.keys(props)
	keys.forEach((k) => {
		const callback = props[k as keyof typeof props]
		if (typeof callback === 'function') {
			newObj[k] = callback(target[k as keyof T1])
		} else {
			newObj[k] = props[k as keyof typeof props]
		}
	})
	return newObj
}
