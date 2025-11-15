import { describe, it, expect } from 'vitest'
import { Logger } from './index.js'
import path from 'node:path'
import fs from 'node:fs'

describe('new Logger()', () => {
	it('写入日志', () => {
		const logsPath = path.join(import.meta.dirname, '../../../logs')
		if (fs.existsSync(logsPath)) {
			fs.rmSync(logsPath, { recursive: true, force: true })
		}
		const logger = new Logger({
			storageDirPath: logsPath
		})
		logger.app.info('这是一条应用日志')
		logger.debug.debug('这是一条调试日志')
		logger.collapse.error('这是一条崩溃日志')
		expect(fs.existsSync(path.join(logsPath, 'app/app.log'))).toBe(true)
		expect(fs.existsSync(path.join(logsPath, 'debug/debug.log'))).toBe(true)
		expect(fs.existsSync(path.join(logsPath, 'collapse/collapse.log'))).toBe(true)
		fs.rmSync(logsPath, { recursive: true, force: true })
	})
})
