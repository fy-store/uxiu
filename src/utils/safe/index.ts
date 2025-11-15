import { isReferenceValue } from '../isReferenceValue/index.js'

function isPromiseLike(v: unknown): v is Promise<unknown> {
	return isReferenceValue(v) && typeof (v as any).then === 'function' && typeof (v as any).catch === 'function'
}

/**
 * 安全的执行一个函数
 * @param fn 执行函数
 * @returns 返回一个元组 [error?, result?]
 * - 如果执行函数抛出错误，则返回 [error, undefined]
 * - 如果执行函数未抛出错误将返回 [undefined, result]
 * - 如果执行函数返回一个 Promise，则返回一个 Promise
 */
export function safe<T>(fn: (...args: any[]) => Promise<T>): Promise<[undefined, T] | [unknown, undefined]>
export function safe<T>(fn: (...args: any[]) => T): [undefined, T] | [unknown, undefined]
export function safe<T>(fn: (...args: any[]) => T | Promise<T>) {
	try {
		const result = fn()
		if (isPromiseLike(result)) {
			return result
				.then((res) => [void 0, res] as [undefined, T])
				.catch((err) => [err as unknown, void 0] as [unknown, undefined])
		}

		return [void 0, result as T]
	} catch (error) {
		return [error as unknown, void 0]
	}
}
