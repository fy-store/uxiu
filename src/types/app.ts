import koa from 'koa'
import http from 'http'

export type BeforeInitCtx = {
	/** koa 实例 */
	app: typeof koa | null
	/** http 服务 */
	server: http.Server | null
}

export type InitedCtx = {
	/** koa 实例 */
	app: typeof koa
	/** http 服务 */
	server: http.Server | null
}

export type BeforeMountCtx = {
	/** koa 实例 */
	app: typeof koa
	/** http 服务 */
	server: http.Server
}

export type MountedCtx = {
	/** koa 实例 */
	app: typeof koa
	/** http 服务 */
	server: http.Server
}

/**
 * 创建实例类型
 */
export type Config = {
	/** 应用挂载的端口, 若环境变量 env 中传递, 则优先使用环境变量 */
	port?: number
	/** 应用初始化前, 此时 koa 还未创建, server 还未创建, 支持 async 返回 Promise 将会等待 */
	beforeInit?: (ctx: BeforeInitCtx) => Promise<void> | void
	/** 应用初始化后, 此时 koa 已经创建, server 还未创建, 支持 async 返回 Promise 将会等待 */
	inited?: (ctx: InitedCtx) => Promise<void> | void
	/** 应用初始化后http服务挂载前, 此时 koa 已经创建, server 已经创建但还未挂载, 支持 async 返回 Promise 将会等待 */
	beforeMount?: (ctx: BeforeMountCtx) => Promise<void> | void
	/** 应用初始化后并且http服务已经挂载, 支持 async 返回 Promise 将会等待 */
	mounted?: (ctx: MountedCtx) => Promise<void> | void
	/** 端口挂载失败错误提示 */
	mountPortErrorTip?: boolean
	/** 应用挂载失败事件 */
	onMountError?: (error: any) => void
}
