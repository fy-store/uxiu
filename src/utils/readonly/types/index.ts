export type ReadonlyTip = 'none' | 'warn' | 'error'

export type ReadonlyOperation =
	| 'set'
	| 'deleteProperty'
	| 'defineProperty'
	| 'apply'
	| 'construct'
	| 'call'

export interface ReadonlyOptions {
	/** 代理唯一标识，在调用 readonly.toOrigin() 时校验可用 */
	sign?: any
	/** 拦截操作时的提示等级 */
	tip?: ReadonlyTip
	/** 按顺序匹配，首个匹配目标的插件生效 */
	plugins?: readonly ReadonlyPlugin[]
}

export interface ShallowReadonlyOptions extends ReadonlyOptions {}

export interface ReadonlyContext<T = any> {
	/** 代理唯一标识，在调用 readonly.toOrigin() 时校验可用 */
	sign: any
	/** 拦截操作时的提示等级 */
	tip: ReadonlyTip
	/** 是否为浅层只读 */
	isShallowReadonly: boolean
	/** 当前代理使用的插件 */
	plugin?: ReadonlyPlugin<any>
	/** 原始数据 */
	data: T
}

export interface ReadonlyPluginBaseEvent<T extends object = object> {
	target: T
	proxy: T
	context: ReadonlyContext<T>
	/** 使用当前只读配置包装数据；浅只读时原样返回 */
	wrap<V>(value: V): ReadonlyDeep<V>
	/** 将只读代理还原为原始数据，普通数据原样返回 */
	unwrap<V>(value: V): V
	/** 按当前 tip 配置报告并阻止操作 */
	prevent(operation: ReadonlyOperation, property?: PropertyKey, value?: any): true
}

export interface ReadonlyPluginGetEvent<T extends object = object> extends ReadonlyPluginBaseEvent<T> {
	property: PropertyKey
	receiver: any
	/** 使用原始目标作为 receiver 读取属性，适用于带内部插槽的内置类型 */
	get(): any
}

export interface ReadonlyPluginSetEvent<T extends object = object> extends ReadonlyPluginBaseEvent<T> {
	property: PropertyKey
	value: any
	receiver: any
	/** 直接写入原始目标 */
	set(): boolean
}

export interface ReadonlyPluginDeleteEvent<T extends object = object> extends ReadonlyPluginBaseEvent<T> {
	property: PropertyKey
	/** 直接删除原始目标属性 */
	delete(): boolean
}

export interface ReadonlyPluginDefineEvent<T extends object = object> extends ReadonlyPluginBaseEvent<T> {
	property: PropertyKey
	attributes: PropertyDescriptor
	/** 直接在原始目标上定义属性 */
	define(): boolean
}

export interface ReadonlyPluginApplyEvent<T extends (...args: any[]) => any = (...args: any[]) => any>
	extends ReadonlyPluginBaseEvent<T> {
	thisArg: any
	args: any[]
	/** 调用原始函数 */
	apply(): any
}

export interface ReadonlyPluginConstructEvent<
	T extends abstract new (...args: any[]) => any = abstract new (...args: any[]) => any
> extends ReadonlyPluginBaseEvent<T> {
	args: any[]
	newTarget: Function
	/** 调用原始构造函数 */
	construct(): object
}

export interface ReadonlyPlugin<T extends object = object> {
	name?: string
	match(target: object): target is T
	get?(event: ReadonlyPluginGetEvent<T>): any
	set?(event: ReadonlyPluginSetEvent<T>): boolean
	deleteProperty?(event: ReadonlyPluginDeleteEvent<T>): boolean
	defineProperty?(event: ReadonlyPluginDefineEvent<T>): boolean
	apply?(event: ReadonlyPluginApplyEvent<any>): any
	construct?(event: ReadonlyPluginConstructEvent<any>): object
}

export interface CreateReadonlyMethodPluginOptions<T extends object> {
	name?: string
	match(target: object): target is T
	/** 需要阻止调用的方法名 */
	methods: readonly PropertyKey[]
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
