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

const CATEGORY_LOG_PATTERN = /^(.+?)-(\d{4}-\d{2}-\d{2}(?:-\d{2})?)(?:\.(\d+))?\.log$/

/** 定位分类目录下最新（时间片段最大、序号最高）的日志文件。 */
function resolveCategoryLogFile(logsPath: string, category: string): string {
	const directory = path.join(logsPath, category)
	const ranked = fs
		.readdirSync(directory)
		.filter((file) => file.endsWith('.log'))
		.map((file) => {
			const match = CATEGORY_LOG_PATTERN.exec(file)
			return { file, timeKey: match?.[2] ?? '', sequence: Number(match?.[3] ?? 0) }
		})
		.sort((a, b) => a.timeKey.localeCompare(b.timeKey) || a.sequence - b.sequence)
	return path.join(directory, ranked[ranked.length - 1].file)
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

		const access = readJsonLines(resolveCategoryLogFile(logsPath, 'access'))
		const business = readJsonLines(resolveCategoryLogFile(logsPath, 'business'))
		const businessError = readJsonLines(resolveCategoryLogFile(logsPath, 'businessError'))
		const systemError = readJsonLines(resolveCategoryLogFile(logsPath, 'systemError'))
		const debug = readJsonLines(resolveCategoryLogFile(logsPath, 'debug'))

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

		expect(readJsonLines(resolveCategoryLogFile(logsPath, 'audit'))[0]).toMatchObject({
			category: 'audit',
			domain: 'security',
			requestId: 'req-1',
			userId: 7
		})
		expect(readJsonLines(resolveCategoryLogFile(logsPath, 'payment'))[0]).toMatchObject({
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

		expect(readJsonLines(resolveCategoryLogFile(logsPath, 'debug'))[0]).toMatchObject({
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

	it('默认按天分文件，并在超过大小上限时按序号继续拆分', async () => {
		const logsPath = createLogsPath()
		const logger = await createLogger({
			storageDirPath: logsPath,
			registerFatalHandler: false,
			sync: true,
			captureStack: false,
			base: null,
			rotation: { maxFileSize: 512 }
		})

		const directory = path.join(logsPath, 'business')
		expect(fs.readdirSync(directory)).toEqual([
			expect.stringMatching(/^business-\d{4}-\d{2}-\d{2}\.log$/)
		])

		for (let index = 0; index < 20; index += 1) {
			businessLogger.info({ index, payload: 'x'.repeat(64) }, 'rotated')
		}
		await logger.close()

		const files = fs.readdirSync(directory)
		expect(files.length).toBeGreaterThan(1)
		expect(files.some((file) => /^business-\d{4}-\d{2}-\d{2}\.log$/.test(file))).toBe(true)
		expect(files.some((file) => /^business-\d{4}-\d{2}-\d{2}\.1\.log$/.test(file))).toBe(true)
		expect(files.flatMap((file) => readJsonLines(path.join(directory, file)))).toHaveLength(20)
		for (const file of files) {
			expect(fs.statSync(path.join(directory, file)).size).toBeLessThanOrEqual(512)
		}
	})

	it('可通过 rotation 调整时间周期或关闭轮转', async () => {
		const hourlyPath = createLogsPath()
		const hourly = await createLogger({
			storageDirPath: hourlyPath,
			registerFatalHandler: false,
			sync: true,
			rotation: { interval: 'hourly' }
		})
		businessLogger.info('hourly')
		await hourly.close()
		expect(fs.readdirSync(path.join(hourlyPath, 'business'))).toEqual([
			expect.stringMatching(/^business-\d{4}-\d{2}-\d{2}-\d{2}\.log$/)
		])

		const sizeOnlyPath = createLogsPath()
		const sizeOnly = await createLogger({
			storageDirPath: sizeOnlyPath,
			registerFatalHandler: false,
			sync: true,
			captureStack: false,
			base: null,
			rotation: { interval: false, maxFileSize: 512 }
		})
		for (let index = 0; index < 10; index += 1) {
			businessLogger.info({ index, payload: 'x'.repeat(64) }, 'sized')
		}
		await sizeOnly.close()
		const sizeOnlyFiles = fs.readdirSync(path.join(sizeOnlyPath, 'business'))
		expect(sizeOnlyFiles.length).toBeGreaterThan(1)
		expect(sizeOnlyFiles.every((file) => /^business(?:\.\d+)?\.log$/.test(file))).toBe(true)

		const plainPath = createLogsPath()
		const plain = await createLogger({
			storageDirPath: plainPath,
			registerFatalHandler: false,
			sync: true,
			rotation: { enabled: false }
		})
		businessLogger.info('no rotation')
		await plain.close()
		expect(fs.readdirSync(path.join(plainPath, 'business'))).toEqual(['business.log'])
	})

	it('校验非法的轮转配置', async () => {
		const storageDirPath = createLogsPath()
		await expect(
			createLogger({ storageDirPath, registerFatalHandler: false, rotation: { interval: 'weekly' as never } })
		).rejects.toThrow('rotation.interval')
		await expect(
			createLogger({ storageDirPath, registerFatalHandler: false, rotation: { maxFileSize: 0 } })
		).rejects.toThrow('rotation.maxFileSize')
		await expect(
			createLogger({ storageDirPath, registerFatalHandler: false, rotation: { enabled: 'yes' as never } })
		).rejects.toThrow('rotation.enabled')
	})

	it.each([
		['正常退出', 'normal', 0],
		['未捕获异常崩溃', 'crash', 1],
		['未处理 Promise 拒绝', 'rejection', 1]
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
		expect(readJsonLines(resolveCategoryLogFile(logsPath, 'business'))[0]).toMatchObject({
			category: 'business',
			mode,
			msg: 'last business log before process exit'
		})
		if (mode !== 'normal') {
			const message = mode === 'crash' ? 'fixture process crashed' : 'fixture promise rejected'
			expect(result.stderr).toContain(`Error: ${message}`)
			expect(readJsonLines(resolveCategoryLogFile(logsPath, 'systemError'))[0]).toMatchObject({
				category: 'systemError',
				event: mode === 'crash' ? 'uncaughtException' : 'unhandledRejection',
				err: { message }
			})
		} else {
			expect(result.stderr).toBe('')
		}
	})
})
