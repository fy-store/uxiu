import http from 'http'
import Koa from 'koa'
import { Config } from '@/types/app.js'

const app = async (config: Config = {}) => {
	const ctx = {
		app: null,
		server: null
	}

	if (config.beforeInit) {
		await config.beforeInit(ctx)
	}

	const app = new Koa({ env: process.env.NODE_ENV || 'production' })
	ctx.app = app
	if (config.inited) {
		await config.inited(ctx)
	}

	const server = http.createServer(app.callback())
	ctx.server = server
	if (config.beforeMount) {
		await config.beforeMount(ctx)
	}

	const { mountPortErrorTip = true } = config
	const port = process.env.port || config.port
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
			await config.mounted(ctx)
		}
	})
}

export default app
