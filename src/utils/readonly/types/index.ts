export type ReadonlyOptions = {
	/** 代理唯一标识, 在调用 readOnly.toOrigin() 时校验可用 */
	sign?: any
	/** 错误提示等级 */
	tip?: 'none' | 'warn' | 'error'
}

export type ReadonlyDeep<T> = T extends (infer U)[]
	? ReadonlyDeep<U>[]
	: T extends object
	? { readonly [P in keyof T]: ReadonlyDeep<T[P]> }
	: T

export type ReadonlyUn<T> = T extends (infer U)[]
	? ReadonlyUn<U>[]
	: T extends object
	? { -readonly [P in keyof T]: ReadonlyUn<T[P]> }
	: T

export type ReadonlyUnDeep<T> = T extends (infer U)[]
	? ReadonlyUnDeep<U>[]
	: T extends object
	? { -readonly [P in keyof T]: ReadonlyUnDeep<T[P]> }
	: T
