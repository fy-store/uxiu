import Koa from 'koa'
import http from 'http'

export type BeforeInitCtx = {
	/** 挂载的端口 */
	port: number
	/** 环境模式, NODE_ENV */
	env: 'production' | 'development'
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext> | null
	/** http 服务 */
	server: http.Server | null
}

export type InitedCtx = {
	/** 挂载的端口 */
	port: number
	/** 环境模式, NODE_ENV */
	env: 'production' | 'development'
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext>
	/** http 服务 */
	server: http.Server | null
}

export type BeforeMountCtx = {
	/** 挂载的端口 */
	port: number
	/** 环境模式, NODE_ENV */
	env: 'production' | 'development'
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext>
	/** http 服务 */
	server: http.Server
}

export type MountedCtx = {
	/** 挂载的端口 */
	port: number
	/** 环境模式, NODE_ENV */
	env: 'production' | 'development'
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext>
	/** http 服务 */
	server: http.Server
}

/**
 * 创建实例配置
 */
export type Config = {
	/** 应用挂载的端口, 默认为 3323 */
	port?: number
	/** 应用初始化前, 此时 koa 还未创建, server 还未创建, 支持 async 返回 Promise 将会等待 */
	beforeInit?: (ctx: BeforeInitCtx) => Promise<any> | void
	/** 应用初始化后, 此时 koa 已经创建, server 还未创建, 支持 async 返回 Promise 将会等待 */
	inited?: (ctx: InitedCtx) => Promise<any> | void
	/** 应用初始化后http服务挂载前, 此时 koa 已经创建, server 已经创建但还未挂载, 支持 async 返回 Promise 将会等待 */
	beforeMount?: (ctx: BeforeMountCtx) => Promise<any> | void
	/** 应用初始化后并且http服务已经挂载, 支持 async 返回 Promise 将会等待 */
	mounted?: (ctx: MountedCtx) => Promise<any> | void
	/** 端口挂载失败错误提示 */
	mountPortErrorTip?: boolean
	/** 应用挂载失败事件 */
	onMountError?: (error: any) => void
}
