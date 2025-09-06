import type { DbFit } from '../index.js'
import type { DbFit2 } from '../dbFit2.js'

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

export interface DestroyCtx {
	/** 触发类型 */
	emitType: 'error' | 'callDestroy' | 'callSubmit'
	/** 传递的参数 */
	args: any[]
	/** 错误信息, 当 emitType=error 时该值才有意义 */
	error?: any
}

export type DbFitEvents<T extends DbFit2 = DbFit2> = {
	/** 首次执行 query */
	firstQuery?: (self: T, ...args: []) => void
	/** 首次执行 query */
	'hook:firstQuery'?: (self: T, ...args: []) => void
	/** query 执行前 */
	beforeQuery?: (self: T, ...args: any[]) => void
	/** query 执行前 */
	'hook:beforeQuery'?: (self: T, ...args: any[]) => void
	/** query 执行后, 如果 query 执行过程失败此事件将不会触发 */
	afterQuery?: (self: T, ...args: any[]) => void
	/** query 执行后, 如果 query 执行过程失败此钩子将不会触发 */
	'hook:afterQuery'?: (self: T, ...args: any[]) => void
	/** query 执行失败或调用 destroy 方法或调用 submit 方法, 当 ctx.emitType=error 请自行手动调用 destroy() */
	destroy?: (self: T, ctx: DestroyCtx) => void
	/** query 执行失败或调用 destroy 方法或调用 submit 方法, 当 ctx.emitType=error 请自行手动调用 destroy() */
	'hook:destroy'?: (self: T, ctx: DestroyCtx) => void
}

export interface DbFit2Options {
	/** 查询实现 */
	query: (...args: any[]) => any
	/** 
	 * 借用另一个实例
	 * - 配置后, destroy()/submit()/query()/queryCount/isDestroyed/bus 方法和属性均指向该实例
	 */
	borrow?: DbFit2
}
