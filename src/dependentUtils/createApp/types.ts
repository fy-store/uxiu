import type { Context, Next } from 'koa'
import type { Bus } from 'event-imt'
import Koa from 'koa'
import http from 'node:http'
import type { LoggerOptions, Logger } from '../logger/index.js'

export interface CreateAppKoaOptions {
	/**
	 * - env uxiu 对 env 进行了特殊处理, 只能为 'production' | 'development' 默认为 CreateAppConfig.env
	 */
	env?: 'production' | 'development'
	/** 签名 cookie 密钥数组 */
	keys?: string[]
	/** 当为 true 时信任代理标头字段 */
	proxy?: boolean
	/** 要忽略的 .subdomains 的偏移量，默认为 2 */
	subdomainOffset?: number
	/** 代理 ip 标头，默认为 X-Forwarded-For, 部署使用代理(nginx等)时取的 ip 标头 */
	proxyIpHeader?: string
	/** 从代理 ip 标头读取的最大 ip 数，默认为 0（表示无穷大） */
	maxIpsCount?: number
	// asyncLocalStorage?: boolean;
}

export interface CreateAppBaseCtx {
	/** 挂载的端口 */
	port: number
	/** 环境变量 */
	env: 'production' | 'development'
	/**
	 * koa 配置选项
	 * - env uxiu 对 env 进行了特殊处理, 只能为 'production' | 'development' 默认为 CreateAppConfig.env
	 */
	koaOptions: CreateAppKoaOptions
	/** 日志模块配置 */
	loggerOptions?: LoggerOptions
}

export type CreateAppBeforeInitCtx = {
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext> | null
	/** http 服务 */
	server: http.Server | null
	/** 日志实例 */
	logger?: Logger
} & CreateAppBaseCtx

export type CreateAppInitedCtx = {
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext>
	/** http 服务 */
	server: http.Server | null
	/** 日志实例 */
	logger?: Logger
} & CreateAppBaseCtx

export type CreateAppBeforeMountCtx = {
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext>
	/** http 服务 */
	server: http.Server
	/** 日志实例 */
	logger?: Logger
} & CreateAppBaseCtx

export type CreateAppMountedCtx = {
	/** koa 实例 */
	app: Koa<Koa.DefaultState, Koa.DefaultContext>
	/** http 服务 */
	server: http.Server
	/** 日志实例 */
	logger?: Logger
} & CreateAppBaseCtx

/**
 * 创建实例配置
 */
export interface CreateAppConfig {
	/** 应用挂载的端口, 默认为 3323 */
	port?: number
	/** - env 只能为 'production' | 'development' 默认为 'production' */
	env?: 'production' | 'development'
	/**
	 * koa 配置选项
	 * - env uxiu 对 env 进行了特殊处理, 只能为 'production' | 'development' 默认为 CreateAppConfig.env
	 */
	koaOptions?: CreateAppKoaOptions
	/** 日志模块配置 */
	loggerOptions?: LoggerOptions
	/** 应用初始化前, 此时 koa 还未创建, server 还未创建, 日志模块还未初始化, 支持 async 返回 Promise 将会等待 */
	beforeInit?: (ctx: CreateAppBeforeInitCtx) => Promise<any> | void
	/** 应用初始化后, 此时 koa 已经创建, 日志模块已经初始化, server 还未创建, 支持 async 返回 Promise 将会等待 */
	inited?: (ctx: CreateAppInitedCtx) => Promise<any> | void
	/** 应用初始化后http服务挂载前, 此时 koa 已经创建, server 已经创建但还未挂载, 支持 async 返回 Promise 将会等待 */
	beforeMount?: (ctx: CreateAppBeforeMountCtx) => Promise<any> | void
	/** 应用初始化后并且http服务已经挂载, 支持 async 返回 Promise 将会等待 */
	mounted?: (ctx: CreateAppMountedCtx) => Promise<any> | void
	/** 端口挂载失败错误提示 */
	mountPortErrorTip?: boolean
	/** 应用挂载失败事件 */
	onMountError?: (error: any) => void
}

export interface BusEvent {
	/**
	 * 当请求发生错误时触发
	 * @param error 错误
	 * @param koaCtx koa 上下文
	 */
	error: (error: unknown, koaCtx: Context) => void
	/**
	 * 当请求发生错误时触发
	 * @param error 错误
	 * @param koaCtx koa 上下文
	 */
	'hook:error': (error: unknown, koaCtx: Context) => void
	/**
	 * 请求成功时触发(未发生错误即认为成功)
	 * @param koaCtx koa 上下文
	 */
	success: (koaCtx: Context) => void
	/**
	 * 请求成功时触发(未发生错误即认为成功)
	 * @param koaCtx koa 上下文
	 */
	'hook:success': (koaCtx: Context) => void
	/**
	 * 执行结束后触发(在所有中间件之后), 不管是否发生错误都会触发
	 * @param koaCtx koa 上下文
	 */
	end: (koaCtx: Context) => void
	/**
	 * 执行结束后触发(在所有中间件之后), 不管是否发生错误都会触发
	 * @param koaCtx koa 上下文
	 */
	'hook:end': (koaCtx: Context) => void
	[key: symbol]: (...args: any[]) => any
}

declare module 'koa' {
	interface Context {
		/** 请求ID, 每次请求自动生成 */
		requestId: string
		/** 当前工作目录路径(进程) */
		pwd: string
		/** 发布订阅模块 */
		bus: Bus<BusEvent>
		/** 日志实例 */
		logger?: Logger
	}
}

declare module '@koa/router' {
	interface RouterParamContext {
		/** 请求ID, 每次请求自动生成 */
		requestId: string
		/** 当前工作目录路径(进程) */
		pwd: string
		/** 发布订阅模块 */
		bus: Bus<BusEvent>
		/** 日志实例 */
		logger?: Logger
	}
}
