// export type JsonValue = string | number | boolean | null | JsonObject | JsonArray

// export interface JsonObject {
// 	[key: string]: JsonValue
// }

// export type JsonArray = JsonValue[]

// export type JsonData = object

export interface Store {
	/** 通过 id 获取数据 */
	get(id: string): Promise<object>
	/** 设置指定 id 的数据 */
	set(id: string, value: object): Promise<object>
	/** 删除指定 id 的数据 */
	del(id: string): Promise<object>
	/** 迭代 store */
	each(fn: (id: string, value: object) => void): Promise<void>
	/** 获取 store 的长度 */
	length(): Promise<number>
}

export interface Options {
	/** 存储实例, 如果未传递将默认使用内存存储 */
	store?: Store
	/** 初始化需要载入的数据 */
	load?: [string, object][]
}
