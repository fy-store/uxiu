export interface SessionStore<T = object> {
	/** 添加数据 */
	add(id: string, value: T): Promise<T>
	/** 通过 id 获取数据 */
	get(id: string): Promise<T>
	/** 设置指定 id 的数据 */
	set(id: string, value: T): Promise<T>
	/** 删除指定 id 的数据 */
	del(id: string): Promise<T>
	/** 迭代 store */
	each(fn: (id: string, value: T) => void): Promise<void>
	/** 获取 store 的长度 */
	length(): Promise<number>
}

export interface SessionOptions<T = object> {
	/** 存储实例, 如果未传递将默认使用内存存储 */
	store?: SessionStore<T>
	/** 初始化需要载入的数据 */
	load?: [string, T][]
}
