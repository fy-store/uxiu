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

	it('按 expandCategories 自动扩展属性并可用（含类型推断）', () => {
		const logsPath = path.join(import.meta.dirname, '../../../logs')
		if (fs.existsSync(logsPath)) {
			fs.rmSync(logsPath, { recursive: true, force: true })
		}
		const logger = new Logger({
			storageDirPath: logsPath,
			expandCategories: {
				/** 注释1 */
				biz: true,
				/** 注释2 */
				feature: true
			}
		})

		// 属性应已被扩展
		expect(typeof logger.biz).toBe('object')
		expect(typeof logger.feature).toBe('object')

		// 能够正常写日志（未单独配置时会走 default -> app 配置）
		logger.biz.info('业务日志一条')
		logger.feature.warn('功能日志一条')
		expect(fs.existsSync(path.join(logsPath, 'app/app.log'))).toBe(true)
		fs.rmSync(logsPath, { recursive: true, force: true })
	})
})
