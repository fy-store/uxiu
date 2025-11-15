import type { CreateAppMountedCtx, CreateAppConfig } from './types.js'
import type { Context } from 'koa'
import crypto from 'node:crypto'
import http from 'http'
import Koa from 'koa'
import { Bus } from 'event-imt'
import { Logger } from '../logger/index.js'
import { readonly } from '../../utils/index.js'
export * from './types.js'

/**
 * 创建一个 koa 实例
 * @param config 配置选项
 */
export async function createApp(config: CreateAppConfig = {}) {
	const opEnv = config.env === 'development' ? 'development' : 'production'
	const { keys, maxIpsCount, proxy, proxyIpHeader, subdomainOffset, env = opEnv } = config.koaOptions ?? {}
	const ctx: CreateAppMountedCtx = {
		env: opEnv,
		port: config.port ?? 3323,
		app: null as any,
		server: null as any,
		koaOptions: { keys, maxIpsCount, proxy, proxyIpHeader, subdomainOffset, env },
		loggerOptions: config.loggerOptions
	}

	const readonlyCtx = readonly.shallowReadonly(ctx)

	if (config.beforeInit) {
		await config.beforeInit(readonlyCtx)
	}

	if (ctx.loggerOptions) {
		ctx.logger = new Logger(ctx.loggerOptions)
	}

	const app = new Koa({ ...ctx.koaOptions, env: ctx.env })
	app.use(async (koaCtx: Context, next) => {
		koaCtx.requestId = crypto.randomUUID() + '-' + Date.now()
		koaCtx.pwd = process.cwd()
		koaCtx.logger = ctx.logger
		koaCtx.bus = new Bus()
		try {
			await next()
			if (koaCtx.bus.has('success')) {
				await koaCtx.bus.emitLineUp('success', koaCtx)
			}
			if (koaCtx.bus.has('hook:success')) {
				await koaCtx.bus.emitLineUp('hook:success', koaCtx)
			}
		} catch (error) {
			if (koaCtx.bus.has('error')) {
				koaCtx.bus.emit('error', error, koaCtx)
			}
			if (koaCtx.bus.has('hook:error')) {
				koaCtx.bus.emitLineUp('hook:error', error, koaCtx)
			}
		} finally {
			if (koaCtx.bus.has('end')) {
				await koaCtx.bus.emitLineUp('end', koaCtx)
			}
			if (koaCtx.bus.has('hook:end')) {
				await koaCtx.bus.emitLineUp('hook:end', koaCtx)
			}
		}
	})
	ctx.app = app
	if (config.inited) {
		await config.inited(readonlyCtx)
	}

	const server = http.createServer(app.callback())
	ctx.server = server
	if (config.beforeMount) {
		await config.beforeMount(readonlyCtx)
	}

	return new Promise<CreateAppMountedCtx>((resolve, reject) => {
		const { mountPortErrorTip = true } = config
		server.on('error', (error: any) => {
			if (config.onMountError) {
				config.onMountError(error)
			} else {
				// 判断端口是否被占用
				if (error?.code === 'EADDRINUSE' && mountPortErrorTip) {
					console.error(`\x1b[31m${ctx.port} 端口已被占用 !\x1B[0m`)
				}
				reject(error)
			}
		})

		server.listen(ctx.port, async () => {
			if (config.mounted) {
				await config.mounted(readonlyCtx)
			}
			resolve(readonlyCtx)
		})
	})
}
