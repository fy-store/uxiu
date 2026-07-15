import { afterEach, describe, expect, it } from 'vitest'
import {
	accessLogger,
	businessErrorLogger,
	businessLogger,
	createLogger,
	debugLogger,
	logger as loggerSingleton,
	systemErrorLogger
} from './index.js'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const testDirectories = new Set<string>()

function createLogsPath(): string {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'uxiu-logger-'))
	testDirectories.add(directory)
	return directory
}

function readJsonLines(file: string): Record<string, any>[] {
	const text = fs.readFileSync(file, 'utf8').trim()
	return text.split('\n').map((line) => JSON.parse(line))
}

afterEach(async () => {
	await loggerSingleton.close()
	for (const directory of testDirectories) {
		fs.rmSync(directory, { recursive: true, force: true })
	}
	testDirectories.clear()
})

describe('createLogger()', () => {
	it('五个固定分类是可直接导入的进程级单例，并写入单行 JSON', async () => {
		const logsPath = createLogsPath()
		const logger = await createLogger({
			storageDirPath: logsPath,
			registerFatalHandler: false,
			base: { service: 'logger-test' }
		})

		expect(logger).toBe(loggerSingleton)
		expect(logger.access).toBe(accessLogger)
		expect(logger.business).toBe(businessLogger)
		expect(logger.businessError).toBe(businessErrorLogger)
		expect(logger.systemError).toBe(systemErrorLogger)
		expect(logger.debug).toBe(debugLogger)

		accessLogger.info({ method: 'GET', path: '/health' }, 'request completed')
		businessLogger.info({ orderId: 42 }, 'order created')
		businessErrorLogger.error(new Error('invalid order'), 'business failed')
		systemErrorLogger.error(new Error('invariant broken'), 'unexpected system state')
		debugLogger.debug({ payload: true }, 'debug payload')
		await Promise.all([logger.close(), logger.close()])

		const access = readJsonLines(path.join(logsPath, 'access/access.log'))
		const business = readJsonLines(path.join(logsPath, 'business/business.log'))
		const businessError = readJsonLines(path.join(logsPath, 'businessError/businessError.log'))
		const systemError = readJsonLines(path.join(logsPath, 'systemError/systemError.log'))
		const debug = readJsonLines(path.join(logsPath, 'debug/debug.log'))

		expect(access[0]).toMatchObject({
			category: 'access',
			service: 'logger-test',
			method: 'GET',
			path: '/health',
			msg: 'request completed'
		})
		expect(access[0].caller.file).toContain('logger.test.ts')
		expect(access[0].stack[0]).toEqual(access[0].caller)
		expect(business[0]).toMatchObject({ category: 'business', orderId: 42 })
		expect(businessError[0]).toMatchObject({
			category: 'businessError',
			err: { message: 'invalid order' }
		})
		expect(systemError[0]).toMatchObject({
			category: 'systemError',
			err: { message: 'invariant broken' }
		})
		expect(debug[0]).toMatchObject({ category: 'debug', payload: true })
	})

	it('快速创建并收集自定义分类，支持 child() 扩展上下文', async () => {
		const logsPath = createLogsPath()
		const logger = await createLogger({
			storageDirPath: logsPath,
			registerFatalHandler: false,
			sync: true,
			categories: {
				audit: { bindings: { domain: 'security' } },
				disabled: false
			}
		})

		logger.category('audit').child({ requestId: 'req-1' }).warn({ userId: 7 }, 'role changed')
		const [payment, samePayment] = await Promise.all([
			logger.createCategory('payment', { level: 'debug' }),
			logger.createCategory('payment', { level: 'debug' })
		])
		expect(payment).toBe(samePayment)
		payment.debug({ amount: 99 }, 'charged')

		expect(logger.categories.get('audit')).toBe(logger.category('audit'))
		expect(logger.categories.get('access')).toBe(accessLogger)
		expect([...logger.categories.keys()]).toEqual([
			'access',
			'business',
			'businessError',
			'systemError',
			'debug',
			'audit',
			'payment'
		])
		await logger.close()

		expect(readJsonLines(path.join(logsPath, 'audit/audit.log'))[0]).toMatchObject({
			category: 'audit',
			domain: 'security',
			requestId: 'req-1',
			userId: 7
		})
		expect(readJsonLines(path.join(logsPath, 'payment/payment.log'))[0]).toMatchObject({
			category: 'payment',
			amount: 99
		})
		expect(fs.existsSync(path.join(logsPath, 'disabled'))).toBe(false)
	})

	it('固定分类可按配置关闭，并可通过快速创建方法重新启用', async () => {
		const logsPath = createLogsPath()
		const logger = await createLogger({
			storageDirPath: logsPath,
			registerFatalHandler: false,
			sync: true,
			fixedCategories: { access: false, debug: false }
		})

		expect(logger.hasCategory('access')).toBe(false)
		expect(logger.hasCategory('debug')).toBe(false)
		expect(() => accessLogger.info('disabled')).toThrow('未启用')
		expect(await logger.createCategory('debug')).toBe(debugLogger)
		debugLogger.debug('enabled at runtime')
		await logger.close()

		expect(readJsonLines(path.join(logsPath, 'debug/debug.log'))[0]).toMatchObject({
			category: 'debug',
			msg: 'enabled at runtime'
		})
		expect(fs.existsSync(path.join(logsPath, 'access'))).toBe(false)
	})

	it('拒绝固定分类混入自定义配置和可能逃逸日志目录的分类名', async () => {
		await expect(
			createLogger({
				storageDirPath: createLogsPath(),
				registerFatalHandler: false,
				categories: { access: true }
			})
		).rejects.toThrow('fixedCategories')

		const logger = await createLogger({
			storageDirPath: createLogsPath(),
			registerFatalHandler: false,
			sync: true
		})
		await expect(logger.createCategory('../outside')).rejects.toThrow('invalid logger category name')
	})

	it.each([
		['正常退出', 'normal', 0],
		['未捕获异常崩溃', 'crash', 1]
	] as const)('%s时同步刷新所有分类的最后日志', (_title, mode, expectedStatus) => {
		const logsPath = createLogsPath()
		const fixture = path.join(import.meta.dirname, 'logger.process.fixture.ts')
		const result = spawnSync(
			process.execPath,
			['--import', 'tsx', fixture, mode, logsPath],
			{ cwd: path.join(import.meta.dirname, '../../..'), encoding: 'utf8', timeout: 10_000 }
		)

		expect(result.error).toBeUndefined()
		expect(result.status, result.stderr).toBe(expectedStatus)
		expect(readJsonLines(path.join(logsPath, 'business/business.log'))[0]).toMatchObject({
			category: 'business',
			mode,
			msg: 'last business log before process exit'
		})
		if (mode === 'crash') {
			expect(readJsonLines(path.join(logsPath, 'systemError/systemError.log'))[0]).toMatchObject({
				category: 'systemError',
				event: 'uncaughtException',
				err: { message: 'fixture process crashed' }
			})
		}
	})
})
