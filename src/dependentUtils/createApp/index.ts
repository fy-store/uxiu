import type { CreateAppMountedCtx, CreateAppConfig } from './types.js'
import http from 'http'
import Koa from 'koa'
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
		koaOptions: { keys, maxIpsCount, proxy, proxyIpHeader, subdomainOffset, env }
	}

	const readonlyCtx = readonly.shallowReadonly(ctx)

	if (config.beforeInit) {
		await config.beforeInit(readonlyCtx)
	}

	const app = new Koa({ ...ctx.koaOptions, env: ctx.env })
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
			// 判断端口是否被占用
			if (error?.code === 'EADDRINUSE' && mountPortErrorTip) {
				console.error(`\x1b[31m${ctx.port} 端口已被占用 !\x1B[0m`)
			}
			if (config.onMountError) {
				config.onMountError(error)
			} else {
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
