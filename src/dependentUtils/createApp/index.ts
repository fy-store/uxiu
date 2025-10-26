import http from 'http'
import Koa from 'koa'
import type { CreateAppMountedCtx, CreateAppConfig } from './types/index.js'
export * from './types/index.js'

/**
 * 创建一个 koa 实例
 * @param config 配置选项
 */
export async function createApp(config: CreateAppConfig = {}) {
	const { keys, maxIpsCount, proxy, proxyIpHeader, subdomainOffset } = config.koaOptions ?? {}
	const ctx: CreateAppMountedCtx = {
		env: process.env.NODE_ENV === 'development' ? 'development' : 'production',
		port: config.port ?? 3323,
		app: null as any,
		server: null as any,
		koaOptions: { keys, maxIpsCount, proxy, proxyIpHeader, subdomainOffset }
	}

	if (config.beforeInit) {
		await config.beforeInit(ctx)
	}

	const app = new Koa({ ...ctx.koaOptions, env: ctx.env })
	ctx.app = app
	if (config.inited) {
		await config.inited(ctx)
	}

	const server = http.createServer(app.callback())
	ctx.server = server
	if (config.beforeMount) {
		await config.beforeMount(ctx)
	}

	return new Promise<CreateAppMountedCtx>((resolve, reject) => {
		const { mountPortErrorTip = true, port = ctx.port } = config
		server.on('error', (error: any) => {
			// 判断端口是否被占用
			if (error?.code === 'EADDRINUSE' && mountPortErrorTip) {
				console.error(`\x1b[31m${port} 端口已被占用 !\x1B[0m`)
			}
			if (config.onMountError) {
				config.onMountError(error)
			} else {
				reject(error)
			}
		})

		server.listen(port, async () => {
			if (config.mounted) {
				await config.mounted(ctx)
				resolve(ctx)
			}
		})
	})
}
