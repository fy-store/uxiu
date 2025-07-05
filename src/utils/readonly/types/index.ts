export type ReadonlyOptions = {
	/** 代理唯一标识, 在调用 readOnly.toOrigin() 时校验可用 */
	sign?: any
	/** 错误提示等级 */
	tip?: 'none' | 'warn' | 'error'
}

export type ReadonlyDeep<T> = {
	readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P]
}

export type ReadonlyUn<T> = {
	-readonly [P in keyof T]: T[P] extends object ? ReadonlyUn<T[P]> : T[P]
}

export type ReadonlyUnDeep<T> = {
	-readonly [P in keyof T]: T[P] extends object ? ReadonlyUnDeep<T[P]> : T[P]
}
