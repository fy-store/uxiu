import { isReferenceValue } from '../isReferenceValue/index.js'
import {
	CONTEXT_SIGN,
	DEFAULT_SIGN,
	findReadonlyPlugin,
	getContext,
	getOrigin,
	isCoreReadonlyTarget,
	isDeepReadonly,
	isReadonly,
	isShallowReadonly,
	proxyCollection,
	tipList,
	toOrigin
} from './context.js'
import tipMap from './tipMap.js'
import type {
	ReadonlyContext,
	ReadonlyDeep,
	ReadonlyOperation,
	ReadonlyOptions,
	ReadonlyPlugin,
	ReadonlyPluginBaseEvent
} from './types/index.js'

interface InternalReadonlyOptions extends ReadonlyOptions {
	cache?: WeakMap<object, any>
	isShallowReadonly: boolean
}

function validateOptions(options: ReadonlyOptions): void {
	if (!isReferenceValue(options)) {
		throw new TypeError(`'options' must be an object, ${String(options)}`)
	}

	const tip = Object.hasOwn(options, 'tip') ? options.tip : 'warn'
	if (!tipList.includes(tip as Required<ReadonlyOptions>['tip'])) {
		throw new TypeError(`'options.tip' must be one of 'error', 'warn', 'none', ${String(options.tip)}`)
	}

	if (options.plugins !== undefined) {
		if (!Array.isArray(options.plugins)) {
			throw new TypeError("'options.plugins' must be an array")
		}
		for (const plugin of options.plugins) {
			if (!plugin || typeof plugin !== 'object' || typeof plugin.match !== 'function') {
				throw new TypeError("'options.plugins' item must be a readonly plugin")
			}
		}
	}
}

function operationMessage(operation: ReadonlyOperation, property?: PropertyKey, value?: any): string {
	if (operation === 'call') {
		return `'target' is readonly, can not call method '${String(property)}'`
	}
	if (operation === 'set') {
		return `'target' is readonly, can not set property '${String(property)}' to '${String(value)}'`
	}
	if (operation === 'deleteProperty') {
		return `'target' is readonly, can not delete property '${String(property)}'`
	}
	if (operation === 'defineProperty') {
		return `'target' is readonly, can not define property '${String(property)}'`
	}
	return `'target' is readonly, can not perform '${operation}'`
}

export function createReadonly<T extends object>(
	target: T,
	options: InternalReadonlyOptions
): ReadonlyDeep<T> {
	validateOptions(options)

	if (!isReferenceValue(target)) {
		throw new TypeError(`'target' must be an object, ${String(target)}`)
	}

	if (!options.isShallowReadonly && isDeepReadonly(target)) {
		return target as ReadonlyDeep<T>
	}
	if (options.isShallowReadonly && isReadonly(target)) {
		return target as ReadonlyDeep<T>
	}
	if (!options.isShallowReadonly && isShallowReadonly(target)) {
		target = toOrigin(target, DEFAULT_SIGN) as T
	}

	const plugins = options.plugins ?? []
	const plugin = findReadonlyPlugin(target, plugins)
	if (!isCoreReadonlyTarget(target) && !plugin) {
		return target as ReadonlyDeep<T>
	}

	const cache = options.cache ?? new WeakMap<object, any>()
	const cached = cache.get(target)
	if (cached) {
		return cached
	}

	const context: ReadonlyContext<T> = {
		tip: options.tip ?? 'warn',
		sign: Object.hasOwn(options, 'sign') ? options.sign : DEFAULT_SIGN,
		data: target,
		isShallowReadonly: options.isShallowReadonly,
		plugin: plugin as ReadonlyPlugin<T> | undefined
	}

	let proxy: T

	const wrap = <V>(value: V): ReadonlyDeep<V> => {
		if (options.isShallowReadonly || !isReferenceValue(value)) {
			return value as ReadonlyDeep<V>
		}
		if (isReadonly(value)) {
			return value as ReadonlyDeep<V>
		}

		return createReadonly(value as object, {
			sign: context.sign,
			tip: context.tip,
			plugins,
			cache,
			isShallowReadonly: false
		}) as ReadonlyDeep<V>
	}

	const prevent = (operation: ReadonlyOperation, property?: PropertyKey, value?: any): true => {
		tipMap[context.tip](operationMessage(operation, property, value), target)
		return true
	}

	const baseEvent = (): ReadonlyPluginBaseEvent<T> => ({
		target,
		proxy,
		context,
		wrap,
		unwrap: getOrigin,
		prevent
	})

	proxy = new Proxy(target, {
		get(target, property, receiver) {
			if (property === CONTEXT_SIGN) {
				return context
			}

			if (plugin?.get) {
				return plugin.get({
					...baseEvent(),
					property,
					receiver,
					get: () => Reflect.get(target, property, target)
				})
			}

			return wrap(Reflect.get(target, property, receiver))
		},

		set(target, property, value, receiver) {
			if (plugin?.set) {
				return plugin.set({
					...baseEvent(),
					property,
					value,
					receiver,
					set: () => Reflect.set(target, property, value, target)
				})
			}
			return prevent('set', property, value)
		},

		deleteProperty(target, property) {
			if (plugin?.deleteProperty) {
				return plugin.deleteProperty({
					...baseEvent(),
					property,
					delete: () => Reflect.deleteProperty(target, property)
				})
			}
			return prevent('deleteProperty', property)
		},

		defineProperty(target, property, attributes) {
			if (plugin?.defineProperty) {
				return plugin.defineProperty({
					...baseEvent(),
					property,
					attributes,
					define: () => Reflect.defineProperty(target, property, attributes)
				})
			}
			return prevent('defineProperty', property, attributes.value)
		},

		apply(target: any, thisArg, args) {
			if (plugin?.apply) {
				return plugin.apply({
					...baseEvent(),
					thisArg,
					args,
					apply: () => Reflect.apply(target, getOrigin(thisArg), args)
				})
			}
			return Reflect.apply(target, getOrigin(thisArg), args)
		},

		construct(target: any, args, newTarget) {
			if (plugin?.construct) {
				return plugin.construct({
					...baseEvent(),
					args,
					newTarget,
					construct: () => Reflect.construct(target, args, getOrigin(newTarget))
				})
			}
			return Reflect.construct(target, args, getOrigin(newTarget))
		}
	})

	cache.set(target, proxy)
	proxyCollection.set(proxy, context)
	return proxy as ReadonlyDeep<T>
}
