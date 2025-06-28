import type { DbFit } from '../index.js'

export interface Options<T extends (...args: any[]) => Promise<any> = (...args: any[]) => Promise<any>> {
	/** sql 查询方法 */
	query: T
	events?: EventType
}

export type EventType = {
	query?: (self: DbFit, ...args: any[]) => void
	exec?: (self: DbFit) => void
	end?: (self: DbFit) => void
}
