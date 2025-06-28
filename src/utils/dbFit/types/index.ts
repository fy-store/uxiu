import type { DbFit } from '../index.js'

export interface Options<T extends (...args: any[]) => Promise<any> = (...args: any[]) => Promise<any>> {
	/** sql 查询方法 */
	query: T
	/** 事件/hook */
	events?: EventType
}

export type EventType = {
	'hook:callEnd'?: (self: DbFit) => void
	'hook:end'?: (self: DbFit) => void
	'hook:beforeExec'?: (self: DbFit, ...args: any[]) => void
	'hook:afterExec'?: (self: DbFit, ...args: any[]) => void
	'hook:beforeQuery'?: (self: DbFit, ...args: any[]) => void
	'hook:afterQuery'?: (self: DbFit, ...args: any[]) => void
	'hook:execError'?: (self: DbFit, error: any) => void
}
