export type CheckPowerMethods =
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

export interface CheckPowerIdentity {
	// use?: (keyof T)[]
	base?: string
	router?: CheckPowerRoute[]
	whiteRouter?: CheckPowerRoute[]
}

export interface CheckPowerRoute {
	/** 允许的路径 */
	path: string
	/** 允许的方法 */
	methods: '*' | CheckPowerMethods | CheckPowerMethods[]
}

export interface CheckPowerOptions {
	/** 基础路径, 后续路径将使用 node:path/posix 中的 join() 拼接基础路径, 默认为 / */
	base?: string
	/** 路由配置 */
	router?: CheckPowerRoute[]
	/** 白名单路由配置 */
	whiteRouter?: CheckPowerRoute[]
}

export type CheckPowerUseRoute = {
	/** 原始路径 */
	originnPath: string
	/** 解析后的路径 */
	path: string
	/** 根据解析后的路径生成的正则表达式 */
	regex: RegExp
	/** 解析后的方法列表 */
	methods: CheckPowerMethods[]
}

export type CheckPowerUseIdenttiy = {
	/** 身份标识 */
	id: string
	/** 基础路径 */
	base: string
	/** 路由配置 */
	router: CheckPowerUseRoute[]
	/** 白名单路由配置 */
	whiteRouter: CheckPowerUseRoute[]
}

export type CheckPowerUseConfig<T> = {
	[K in keyof T]: CheckPowerUseIdenttiy
}
