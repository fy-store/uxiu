import { describe, expect, it } from 'vitest'
import { loadPeerDependency } from './index.js'

function moduleNotFound(name: string): NodeJS.ErrnoException {
	const error = new Error(
		`Cannot find package '${name}' imported from /app/index.js`
	) as NodeJS.ErrnoException
	error.code = 'ERR_MODULE_NOT_FOUND'
	return error
}

describe('loadPeerDependency()', () => {
	it('依赖存在时返回加载结果', async () => {
		const value = await loadPeerDependency('koa', 'createApp', async () => ({ default: 'koa' }))
		expect(value).toEqual({ default: 'koa' })
	})

	it('依赖缺失时抛出包含安装命令的错误并保留 cause', async () => {
		const cause = moduleNotFound('koa')
		const error = await loadPeerDependency('koa', 'createApp', async () => {
			throw cause
		}).catch((reason) => reason as Error)

		expect(error).toBeInstanceOf(Error)
		expect(error.message).toBe(
			'createApp需要可选依赖 "koa"，请先运行 "pnpm add koa"（或使用当前包管理器安装 koa）。'
		)
		expect(error.cause).toBe(cause)
	})

	it('支持带作用域的包名', async () => {
		await expect(
			loadPeerDependency('@koa/router', '路由模块', async () => {
				throw moduleNotFound('@koa/router')
			})
		).rejects.toThrow('请先运行 "pnpm add @koa/router"')
	})

	it('缺失的是其他包或并非模块缺失错误时原样抛出', async () => {
		const otherPackage = moduleNotFound('koa-compose')
		await expect(
			loadPeerDependency('koa', 'createApp', async () => {
				throw otherPackage
			})
		).rejects.toBe(otherPackage)

		const runtimeError = new Error('koa 初始化失败')
		await expect(
			loadPeerDependency('koa', 'createApp', async () => {
				throw runtimeError
			})
		).rejects.toBe(runtimeError)
	})
})
