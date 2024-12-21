import http from 'http'
import Koa from 'koa'
import { type MountedCtx, type Config } from '@/types/app.js'
import { readonly } from '@/utils/index.js'
export * from './utils/index.js'

/**
 * 创建一个 koa 实例
 * @param config 配置选项
 */
export const crateApp = async (config: Config = {}) => {
	const ctx: MountedCtx = {
		env: process.env.NODE_ENV === 'development' ? 'development' : 'production',
		port: config.port || 3323,
		app: null,
		server: null
	}

	const readonlyCtx = readonly(ctx, { tip: 'error' })

	if (config.beforeInit) {
		await config.beforeInit(readonlyCtx)
	}

	const app = new Koa({ env: ctx.env })
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
			console.log(`${port} 端口已被占用 !`)
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
}

export default crateApp
