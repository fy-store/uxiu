import type { ReadonlyPlugin, ReadonlyPluginGetEvent } from '../types/index.js'

type Collection = Map<any, any> | Set<any> | WeakMap<object, any> | WeakSet<object>

const collectionMutationMethods = new Set<PropertyKey>(['set', 'add', 'delete', 'clear'])
const iteratorCallbackMethods = new Set<PropertyKey>(['map', 'filter', 'flatMap', 'forEach', 'some', 'every', 'find'])
const iteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(new Map().values()))

function isCollection(target: object): target is Collection {
	return target instanceof Map || target instanceof Set || target instanceof WeakMap || target instanceof WeakSet
}

function isIterator(target: object): boolean {
	let prototype = Object.getPrototypeOf(target)
	while (prototype) {
		if (Object.is(prototype, iteratorPrototype)) {
			return true
		}
		prototype = Object.getPrototypeOf(prototype)
	}
	return false
}

function blockedCollectionResult(property: PropertyKey, proxy: object): any {
	if (property === 'set' || property === 'add') {
		return proxy
	}
	if (property === 'delete') {
		return false
	}
	return undefined
}

function getCollectionProperty(event: ReadonlyPluginGetEvent<Collection>): any {
	const value = event.get()
	if (typeof value !== 'function' || event.property === 'constructor') {
		return event.wrap(value)
	}

	if (collectionMutationMethods.has(event.property)) {
		return (...args: any[]) => {
			event.prevent('call', event.property, args)
			return blockedCollectionResult(event.property, event.proxy)
		}
	}

	if (event.property === 'forEach' && (event.target instanceof Map || event.target instanceof Set)) {
		return (callback: (...args: any[]) => any, thisArg?: any) => {
			if (typeof callback !== 'function') {
				return Reflect.apply(value, event.target, [callback, thisArg])
			}
			return Reflect.apply(value, event.target, [
				(...args: any[]) =>
					Reflect.apply(
						callback,
						thisArg,
						args.map((item, index) => (index === 2 ? event.proxy : event.wrap(item)))
					)
			])
		}
	}

	return (...args: any[]) => {
		const result = Reflect.apply(value, event.target, args.map(event.unwrap))
		return event.wrap(result)
	}
}

function getIteratorProperty(event: ReadonlyPluginGetEvent<object>): any {
	const value = event.get()
	if (typeof value !== 'function' || event.property === 'constructor') {
		return event.wrap(value)
	}

	if (event.property === Symbol.iterator) {
		return () => event.proxy
	}

	if (iteratorCallbackMethods.has(event.property)) {
		return (callback: (...args: any[]) => any, ...args: any[]) => {
			if (typeof callback !== 'function') {
				return Reflect.apply(value, event.target, [callback, ...args])
			}
			const result = Reflect.apply(value, event.target, [
				(...callbackArgs: any[]) => Reflect.apply(callback, undefined, callbackArgs.map(event.wrap)),
				...args
			])
			return event.wrap(result)
		}
	}

	if (event.property === 'reduce') {
		return (callback: (...args: any[]) => any, ...args: any[]) => {
			if (typeof callback !== 'function') {
				return Reflect.apply(value, event.target, [callback, ...args])
			}
			const hasInitialValue = args.length > 0
			let isFirstCall = true
			const result = Reflect.apply(value, event.target, [
				(accumulator: any, item: any, index: number) => {
					const readonlyAccumulator = !hasInitialValue && isFirstCall ? event.wrap(accumulator) : accumulator
					isFirstCall = false
					return callback(readonlyAccumulator, event.wrap(item), index)
				},
				...args
			])
			return hasInitialValue ? result : event.wrap(result)
		}
	}

	return (...args: any[]) => event.wrap(Reflect.apply(value, event.target, args.map(event.unwrap)))
}

/**
 * 阻止 Map、Set、WeakMap、WeakSet 的修改方法。
 * 深只读时同时包装查询结果、forEach 参数和迭代器产物。
 */
export const collectionReadonlyPlugin: ReadonlyPlugin<object> = {
	name: 'collection',
	match: (target): target is object => isCollection(target) || isIterator(target),
	get(event) {
		return isCollection(event.target)
			? getCollectionProperty(event as ReadonlyPluginGetEvent<Collection>)
			: getIteratorProperty(event)
	}
}
