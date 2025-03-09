type Target<T1, T2> = {
	[K in keyof T1 as K extends keyof T2 ? never : K]: T1[K]
}

type Props<T1, T2> = {
	[K in keyof T2]: T2[K] extends (value: any) => infer R ? R : T2[K]
}

/**
 * 映射对象属性重新赋值(不改变源对象)
 * - 改变后新的对象, 若需要直接操作原对象可使用 convertProps.effect() 方法
 * @param target 目标
 * @param props 属性配置
 */
export const convertProps = <T1 extends object, T2 extends Record<string, any>>(
	target: T1,
	props: { [k in keyof T1]?: (value: T1[k]) => any } | T2
): Target<T1, T2> & Props<T1, T2> => {
	const newObj: any = { ...target }
	const keys = Object.keys(props)
	keys.forEach((k) => {
		const callback = props[k]
		if (typeof callback === 'function') {
			newObj[k] = callback(target[k])
		} else {
			newObj[k] = props[k]
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
convertProps.effect = <T1 extends object, T2 extends Record<string, any>>(
	target: T1,
	props: { [k in keyof T1]?: (value: T1[k]) => any } | T2
): Target<T1, T2> & Props<T1, T2> => {
	const newObj: any = target
	const keys = Object.keys(props)
	keys.forEach((k) => {
		const callback = props[k]
		if (typeof callback === 'function') {
			newObj[k] = callback(target[k])
		} else {
			newObj[k] = props[k]
		}
	})
	return newObj
}
