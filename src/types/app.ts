import Koa from 'koa'
import http from 'http'

type KoaOptions = {
	/** 签名 cookie 密钥数组 */
	keys?: string[];
	/** 当为 true 时信任代理标头字段 */
	proxy?: boolean;
	/** 要忽略的 .subdomains 的偏移量，默认为 2 */
	subdomainOffset?: number;
	/** 代理 ip 标头，默认为 X-Forwarded-For */
	proxyIpHeader?: string;
	/** 从代理 ip 标头读取的最大 ip 数，默认为 0（表示无穷大） */
	maxIpsCount?: number;
	// asyncLocalStorage?: boolean;
}

type BaseCtx = {
	/** 挂载的端口 */
	port: number
	/** 环境模式, NODE_ENV */
	env: 'production' | 'development'
	/** 
	 * koa 配置选项
	 * - env uxiu 对env进行了特殊处理, 只能为 'production' | 'development' 默认为 'production', 通过环境变量 NODE_ENV 可更改为 'development'
	 */
	koaOptions: Readonly<KoaOptions>
}

export type BeforeInitCtx = {
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext> | null
	/** http 服务 */
	server: http.Server | null
} & BaseCtx

export type InitedCtx = {
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext>
	/** http 服务 */
	server: http.Server | null
} & BaseCtx

export type BeforeMountCtx = {
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext>
	/** http 服务 */
	server: http.Server
} & BaseCtx

export type MountedCtx = {
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext>
	/** http 服务 */
	server: http.Server
} & BaseCtx

/**
 * 创建实例配置
 */
export type Config = {
	/** 应用挂载的端口, 默认为 3323 */
	port?: number
	/** 
	 * koa 配置选项
	 * - env uxiu 对env进行了特殊处理, 只能为 'production' | 'development' 默认为 'production', 通过环境变量 NODE_ENV 可更改为 'development'
	 */
	koaOptions?: KoaOptions
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
