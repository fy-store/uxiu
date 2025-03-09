import http from 'http'
import Koa from 'koa'
import type { MountedCtx, Config } from '@/types/app.js'
import { readonly } from '@/utils/index.js'
export * from './utils/index.js'
export * from './common/index.js'

/**
 * 创建一个 koa 实例
 * @param config 配置选项
 */
export const createApp = async (config: Config = {}) => {
	const { keys, maxIpsCount, proxy, proxyIpHeader, subdomainOffset } = config.koaOptions ?? {}
	const ctx: MountedCtx = {
		env: process.env.NODE_ENV === 'development' ? 'development' : 'production',
		port: config.port ?? 3323,
		app: null,
		server: null,
		koaOptions: readonly.shallowReadonly({ keys, maxIpsCount, proxy, proxyIpHeader, subdomainOffset })
	}

	const readonlyCtx = readonly.shallowReadonly(ctx, { tip: 'error' })

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

	const { mountPortErrorTip = true, port = ctx.port } = config
	server.on('error', (error: any) => {
		// 判断端口是否被占用
		if (error?.code === 'EADDRINUSE' && mountPortErrorTip) {
			console.error(`\x1b[31m${port} 端口已被占用 !\x1B[0m`)
		}
		if (config.onMountError) {
			config.onMountError(error)
		} else {
			throw error
		}
	})

	server.listen(port, async () => {
		if (config.mounted) {
			await config.mounted(readonlyCtx)
		}
	})

	return readonlyCtx
}

export default createApp
