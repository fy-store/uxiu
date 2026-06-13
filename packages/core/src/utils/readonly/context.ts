import type { ReadonlyContext, ReadonlyOptions, ReadonlyPlugin, ReadonlyUnDeep } from './types/index.js'

export const DEFAULT_SIGN = Symbol('default_sign')
export const CONTEXT_SIGN = Symbol('readonly_context_sign')
export const tipList = ['error', 'warn', 'none'] as const

/** 只读代理与上下文的映射 */
export const proxyCollection = new WeakMap<object, ReadonlyContext>()

export function getContext<T = any>(target: any): ReadonlyContext<T> | undefined {
	if ((typeof target !== 'object' || target === null) && typeof target !== 'function') {
		return undefined
	}
	return proxyCollection.get(target) as ReadonlyContext<T> | undefined
}

export function getOrigin<T>(target: T): T {
	return (getContext(target)?.data as T | undefined) ?? target
}

export function isShallowReadonly(target: any): boolean {
	return getContext(target)?.isShallowReadonly === true
}

export function isDeepReadonly(target: any): boolean {
	const context = getContext(target)
	return Boolean(context && !context.isShallowReadonly)
}

export function isReadonly(target: any): boolean {
	return Boolean(getContext(target))
}

export function toOrigin<T extends object>(target: T, sign?: any): ReadonlyUnDeep<T> {
	const context = getContext(target)
	if (!context) {
		throw new Error("'target' is not readonly")
	}

	if (
		sign !== DEFAULT_SIGN &&
		!(context.sign === DEFAULT_SIGN && sign === undefined) &&
		!Object.is(context.sign, sign)
	) {
		throw new Error("'sign' is not match")
	}
	return context.data as ReadonlyUnDeep<T>
}

export function getTip(target: any): ReadonlyOptions['tip'] {
	return getContext(target)?.tip
}

export function isCoreReadonlyTarget(target: unknown): target is object {
	if (Array.isArray(target)) {
		return true
	}
	if (target === null || typeof target !== 'object') {
		return false
	}
	const prototype = Object.getPrototypeOf(target)
	return prototype === Object.prototype || prototype === null
}

export function findReadonlyPlugin(
	target: object,
	plugins: readonly ReadonlyPlugin[]
): ReadonlyPlugin | undefined {
	return plugins.find((plugin) => plugin.match(target))
}
