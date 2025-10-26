import type { DbFit } from './index.js'

export interface DestroyCtx {
	/** 触发类型 */
	emitType: 'error' | 'callDestroy' | 'callSubmit'
	/** 传递的参数 */
	args: any[]
	/** 错误信息, 当 emitType=error 时该值才有意义 */
	error?: any
}

export type DbFitEvents<T extends DbFit = DbFit> = {
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

export interface DbFitOptions {
	/** 查询实现 */
	query: (...args: any[]) => any
	/**
	 * 借用另一个实例
	 * - 配置后, destroy()/submit()/query()/queryCount/isDestroyed/bus 方法和属性均指向该实例
	 */
	borrow?: DbFit
}
