import type { DbFit } from '../index.js'

export interface DbFitOptions<T extends (...args: any[]) => Promise<any> = (...args: any[]) => Promise<any>> {
	/** sql 查询方法 */
	query: T
	/** 事件/hook */
	events?: DbFitEventType
}

export type DbFitEventType = {
	/** 调用 $end() 时 */
	'hook:callEnd'?: (self: DbFit) => void
	/** 实例已经结束(调用 $end() 或 $exec() 后) */
	'hook:end'?: (self: DbFit) => void
	/** $exec() 正式执行前 */
	'hook:beforeExec'?: (self: DbFit, ...args: any[]) => void
	/** $exec() 成功执行后 */
	'hook:afterExec'?: (self: DbFit, ...args: any[]) => void
	/** 查询执行前 */
	'hook:beforeQuery'?: (self: DbFit, ...args: any[]) => void
	/** 查询成功执行后 */
	'hook:afterQuery'?: (self: DbFit, ...args: any[]) => void
	/** $exec() 执行错误, 监听该事件后遇到异常将不会抛出, 第二个参数为错误信息 */
	'hook:execError'?: (self: DbFit, error: any) => void
}
