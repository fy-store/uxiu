export interface ReadonlyOptions {
	/** 代理唯一标识, 在调用 readOnly.toOrigin() 时校验可用 */
	sign?: any
	/** 错误提示等级 */
	tip?: 'none' | 'warn' | 'error'
	/** 自定义函数操作行为 */
	applyHandler?: (target: any, thisArg: any, argArray: any[], context: ReadonlyContext) => any
	/** 自定义属性设置行为 */
	setHandler?: (target: any, p: PropertyKey, value: any, receiver: any, context: ReadonlyContext) => boolean
}

export interface ShallowReadonlyOptions extends ReadonlyOptions {
	/** 函数属性使用代理包装, 开启后函数支持使用 this 操作数据, 否则 this 将指向代理对象, 默认为 true */
	proxyFunction?: boolean
}

export interface ReadonlyContext<T = any> {
	/** 代理唯一标识, 在调用 readOnly.toOrigin() 时校验可用 */
	sign: any
	/** 错误提示等级 */
	tip: 'none' | 'warn' | 'error'
	/** 是否为浅层只读 */
	isShallowReadonly: boolean
	/** 函数属性使用代理包装, 开启后函数支持使用 this 操作数据, 否则 this 将指向代理对象, 默认为 true */
	proxyFunction: boolean
	data: T
}

export type ReadonlyDeep<T> = T extends (infer U)[]
	? ReadonlyDeep<U>[]
	: T extends (...args: any) => any
	? T
	: T extends abstract new (...args: any) => any
	? T
	: T extends object
	? { readonly [P in keyof T]: ReadonlyDeep<T[P]> }
	: T

export type ReadonlyUn<T> = T extends (infer U)[]
	? ReadonlyUn<U>[]
	: T extends (...args: any) => any
	? T
	: T extends abstract new (...args: any) => any
	? T
	: T extends object
	? { -readonly [P in keyof T]: ReadonlyUn<T[P]> }
	: T

export type ReadonlyUnDeep<T> = T extends (infer U)[]
	? ReadonlyUnDeep<U>[]
	: T extends (...args: any) => any
	? T
	: T extends abstract new (...args: any) => any
	? T
	: T extends object
	? { -readonly [P in keyof T]: ReadonlyUnDeep<T[P]> }
	: T
