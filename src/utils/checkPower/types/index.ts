export type Methods =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'DELETE'
	| 'PATCH'
	| 'HEAD'
	| 'OPTIONS'
	| 'CONNECT'
	| 'TRACE'
	| 'LINK'
	| 'UNLINK'
	| 'get'
	| 'post'
	| 'put'
	| 'delete'
	| 'patch'
	| 'head'
	| 'options'
	| 'connect'
	| 'trace'
	| 'link'
	| 'unlink'

export interface Identity {
	// use?: (keyof T)[]
	base?: string
	router?: Route[]
	whiteRouter?: Route[]
}

export interface Route {
	/** 允许的路径 */
	path: string
	/** 允许的方法 */
	methods: '*' | Methods | Methods[]
}

export interface Options {
	/** 基础路径, 后续路径将使用 node:path/posix 中的 join() 拼接基础路径, 默认为 / */
	base?: string
	/** 路由配置 */
	router?: Route[]
	/** 白名单路由配置 */
	whiteRouter?: Route[]
}

export type UseRoute = {
	/** 原始路径 */
	originnPath: string
	/** 解析后的路径 */
	path: string
	/** 根据解析后的路径生成的正则表达式 */
	regex: RegExp
	/** 解析后的方法列表 */
	methods: Methods[]
}

export type UseIdenttiy = {
	/** 身份标识 */
	id: string
	/** 基础路径 */
	base: string
	/** 路由配置 */
	router: UseRoute[]
	/** 白名单路由配置 */
	whiteRouter: UseRoute[]
}

export type UseConfig<T> = {
	[K in keyof T]: UseIdenttiy
}
