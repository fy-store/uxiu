import type { State, Events, Options, Callback, CallbackOptions, OnOptions, EventStore } from './types/index.js'
import { isObj } from '../isObj/index.js'
import { isString } from '../isString/index.js'
import { isSymbol } from '../isSymbol/index.js'
import { isFunction } from '../isFunction/index.js'
import { isArray } from '../isArray/index.js'
import { isBoolean } from '../isBoolean/index.js'
import { isUndefined } from '../isUndefined/index.js'

export class EventBus<S extends State, E extends Events<S, EventBus<S, E>>> {
	#state: S
	#events = new Map<symbol, EventStore<S, EventBus<S, E>>[]>()
	#keyMap = Object.create(null) as Record<string, symbol>
	constructor(options?: Options<S, E>) {
		const { state = {}, events = {} } = options ?? {}
		if (!isObj(state)) {
			throw new TypeError('state must be an object')
		}
		if (!isObj(events)) {
			throw new TypeError('events must be an object')
		}
		this.#state = state as S

		Object.entries(events).forEach(([eventName, callback]) => {
			let callbackOptions: EventStore<S, EventBus<S, E>>[]
			const symbol = Symbol(eventName)
			if (isFunction(callback)) {
				callbackOptions = [
					{
						once: false,
						fn: callback,
						name: eventName,
						sign: symbol
					}
				]
			} else if (isArray(callback)) {
				callbackOptions = callback.map((callback, i) => {
					if (isFunction<Callback<S, EventBus<S, E>>>(callback)) {
						return {
							once: false,
							fn: callback,
							name: eventName,
							sign: symbol
						}
					} else if (isObj<CallbackOptions<S, EventBus<S, E>>>(callback)) {
						if (!(isSymbol(callback.sign) || isUndefined(callback.sign))) {
							throw new TypeError(`callback.sign must be a symbol or undefined in options.events[${i}]`)
						}
						if (!isFunction(callback.fn)) {
							throw new TypeError(`callback.fn must be a function in options.events[${i}]`)
						}
						return {
							once: !!callback.once,
							fn: callback.fn,
							name: eventName,
							sign: callback.sign ?? symbol
						}
					}

					throw new TypeError('callback must be a function or an object[]')
				})
			}

			this.#events.set(symbol, callbackOptions)
			this.#keyMap[eventName] = symbol
		})
	}

	get state() {
		return this.#state
	}

	#on(eventName: string | symbol, callback: Callback<S, EventBus<S, E>>, once: boolean, options?: OnOptions) {
		if (!isFunction(callback)) {
			throw new TypeError('callback must be a function')
		}

		let symbol: symbol
		if (isSymbol(eventName)) {
			symbol = eventName
			if (!this.#events.has(eventName)) {
				this.#events.set(eventName, [])
			}
			this.#events.get(eventName).push({
				once,
				name: void 0,
				fn: callback,
				sign: symbol
			})
		} else if (isString(eventName)) {
			symbol = Symbol(options?.msg ?? eventName)
			if (!this.#keyMap[eventName]) {
				this.#keyMap[eventName] = symbol
			}
			this.#events.get(symbol).push({
				once,
				name: eventName,
				fn: callback,
				sign: symbol
			})
		} else {
			throw new TypeError('eventName must be a string or a symbol')
		}
		return symbol
	}

	on(eventName: keyof E, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol
	on(eventName: string | symbol, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol
	on(eventName: string | symbol, callback: Callback<S, EventBus<S, E>>, options?: OnOptions) {
		return this.#on(eventName, callback, false, options)
	}

	once(eventName: keyof E, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol
	once(eventName: string | symbol, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol
	once(eventName: string | symbol, callback: Callback<S, EventBus<S, E>>, options?: OnOptions) {
		return this.#on(eventName, callback, true, options)
	}

	emit(eventName: keyof E, ...args: any[]): this
	emit(eventName: string | symbol, ...args: any[]): this
	emit(eventName: string | symbol, ...args: any[]) {
		if (isSymbol(eventName)) {
			const eventArr = this.#events.get(eventName)
			if (!eventArr) {
				logWarn(`eventName -> '${String(eventName)}' is not exist`)
				return this
			}
			for (let i = 0; i < eventArr.length; i++) {
				const { fn, once } = eventArr[i]
				try {
					fn(
						{
							self: this,
							state: this.state
						},
						...args
					)
				} catch (error) {
					logError(error)
				}
				if (once) {
					eventArr.splice(i, 1)
					i--
				}
			}
		} else if (isString(eventName)) {
			const symbol = this.#keyMap[eventName]
			if (!symbol) {
				logWarn(`eventName -> '${String(eventName)}' is not exist`)
				return this
			}
			const eventArr = this.#events.get(symbol)
			for (let i = 0; i < eventArr.length; i++) {
				const { fn, once } = eventArr[i]
				try {
					fn(
						{
							self: this,
							state: this.state
						},
						...args
					)
				} catch (error) {
					logError(error)
				}
				if (once) {
					eventArr.splice(i, 1)
					i--
				}
			}
		} else {
			throw new TypeError('eventName must be a string or a symbol')
		}
		return this
	}

	off(eventName: keyof E): this
	off(eventName: string | symbol): this
	off(eventName: string | symbol) {
		if (isSymbol(eventName)) {
			const eventArr = this.#events.get(eventName)
			if (!eventArr) {
				logWarn(`eventName -> '${String(eventName)}' is not exist`)
				return this
			}
			for (let i = 0; i < eventArr.length; i++) {
				const { fn, once } = eventArr[i]
				try {
					fn({
						self: this,
						state: this.state
					})
				} catch (error) {
					logError(error)
				}
				if (once) {
					eventArr.splice(i, 1)
					i--
				}
			}
		} else if (isString(eventName)) {
			const symbol = this.#keyMap[eventName]
			if (!symbol) {
				logWarn(`eventName -> '${String(eventName)}' is not exist`)
				return this
			}
			const eventArr = this.#events.get(symbol)
			for (let i = 0; i < eventArr.length; i++) {
				const { fn, once } = eventArr[i]
				try {
					fn({
						self: this,
						state: this.state
					})
				} catch (error) {
					logError(error)
				}
				if (once) {
					eventArr.splice(i, 1)
					i--
				}
			}
		} else {
			throw new TypeError('eventName must be a string or a symbol')
		}
		return this
	}
}

function logWarn(...args: any[]) {
	console.warn(...args)
}

function logError(...args: any[]) {
	console.error(...args)
}

const event = new EventBus({
	state: {
		a: 1,
		b: 'b'
	},
	events: {
		changeA(a) {
			console.log('changeA', a)
		},
		changeB: [
			(ctx) => {
				console.log('changeB', ctx)
			}
		],
		changeC: [
			{
				fn: (ctx) => {
					console.log('changeC', ctx)
				},
				once: true
			}
		]
	}
})

event.emit('changeA', 1, 2, 3)

event.state.b
const sign = event.on('changeA', (ctx, a: string, b: number) => {
	// ctx.self.on('')
})

event.on('changeA1', (ctx) => {})

// type EventMap = Record<string, (...args: any[]) => void>

// interface EventBusOptions<S extends Record<string, any>, E extends EventMap> {
// 	state: S
// 	event: E
// }

// class EventBus<S extends Record<string, any>, E extends EventMap> {
// 	public state: S
// 	private listeners: { [K in keyof E]?: E[K][] } = {}

// 	constructor(options: EventBusOptions<S, E>) {
// 		this.state = options.state

// 		// 初始化时注册的事件（可选）
// 		for (const key in options.event) {
// 			this.listeners[key] = [options.event[key]]
// 		}
// 	}

// 	on<K extends keyof E>(eventName: K, callback: E[K]) {
// 		this.listeners[eventName] ||= []
// 		this.listeners[eventName]!.push(callback)
// 	}

// 	off<K extends keyof E>(eventName: K, callback: E[K]) {
// 		this.listeners[eventName] = (this.listeners[eventName] || []).filter((fn) => fn !== callback)
// 	}

// 	emit<K extends keyof E>(eventName: K, ...args: Parameters<E[K]>) {
// 		this.listeners[eventName]?.forEach((fn) => fn(...args))
// 	}
// }

// const event = new EventBus({
// 	state: {
// 		a: 1,
// 		b: 'b'
// 	},
// 	event: {
// 		changeA(a) {
// 			console.log('changeA', a)
// 		},
// 		changeB(b) {
// 			console.log('changeB', b)
// 		}
// 	}
// })

// event.state.a
// event.on('changeA')
