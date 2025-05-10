import type {
	State,
	EventMapOption,
	Options,
	Callback,
	CallbackOptions,
	OnOptions,
	CallbackInfo,
	EventMap
} from './types/index.js'
import { isObj } from '../isObj/index.js'
import { isString } from '../isString/index.js'
import { isSymbol } from '../isSymbol/index.js'
import { isFunction } from '../isFunction/index.js'
import { isArray } from '../isArray/index.js'
import { isUndefined } from '../isUndefined/index.js'

export class EventBus<S extends State, E extends EventMapOption<S, EventBus<S, E>>> {
	#state: S
	#eventMap = Object.create(null) as EventMap<S, EventBus<S, E>>
	constructor(options?: Options<S, E>) {
		type Self = EventBus<S, E>
		const { state = {}, eventMap = {} } = options ?? {}
		if (!isObj(state)) {
			throw new TypeError('state must be an object')
		}
		if (!isObj(eventMap)) {
			throw new TypeError('events must be an object')
		}

		this.#state = state as S
		const eventMapKeys = Reflect.ownKeys(eventMap)
		eventMapKeys.forEach((key) => {
			const eventOption: EventMapOption<S, Self> = eventMap[key]
			let callbackInfoList: CallbackInfo<S, Self>[]
			if (isFunction<Callback<S, Self>>(eventOption)) {
				callbackInfoList = [
					{
						once: false,
						fn: eventOption,
						sign: Symbol()
					}
				]
			} else if (isArray(eventOption)) {
				callbackInfoList = eventOption.map((it, i) => {
					if (isFunction<Callback<S, Self>>(it)) {
						return {
							once: false,
							fn: it,
							sign: Symbol()
						}
					} else if (isObj<CallbackOptions<S, Self>>(it)) {
						if (!(isSymbol(it.sign) || isUndefined(it.sign))) {
							throw new TypeError(
								`options.eventMap${String(key)}[${i}].sign must be a symbol or undefined`
							)
						}
						if (!isFunction(it.fn)) {
							throw new TypeError(`options.eventMap${String(key)}[${i}].fn must be a function`)
						}
						return {
							once: !!it.once,
							fn: it.fn,
							sign: it.sign ?? Symbol()
						}
					}
					throw new TypeError(`options.eventMap${String(key)} must be a function or object[]`)
				})
			}

			this.#eventMap[key] = callbackInfoList
		})
	}

	get state() {
		return this.#state
	}

	#on(
		eventName: string | symbol,
		callback: Callback<S, EventBus<S, E>>,
		once: boolean,
		options: OnOptions = {}
	): symbol {
		if (!(isString(eventName) || isSymbol(eventName))) {
			throw new TypeError('eventName must be a string or symbol')
		}

		if (!isFunction(callback)) {
			throw new TypeError('callback must be a function')
		}

		if (!isObj(options)) {
			throw new TypeError('options must be a object')
		}

		if (!(isSymbol(options.sign) || isUndefined(options.sign))) {
			throw new TypeError('options.sign must be a symbol')
		}

		const symbol: symbol = options.sign ?? Symbol()
		if (!this.#eventMap[eventName]) {
			this.#eventMap[eventName] = []
		}

		this.#eventMap[eventName].push({
			once,
			fn: callback,
			sign: symbol
		})

		return symbol
	}

	on(eventName: keyof E, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol
	on(eventName: string | symbol, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol
	on(eventName: string | symbol, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol {
		return this.#on(eventName, callback, false, options)
	}

	once(eventName: keyof E, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol
	once(eventName: string | symbol, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol
	once(eventName: string | symbol, callback: Callback<S, EventBus<S, E>>, options?: OnOptions): symbol {
		return this.#on(eventName, callback, true, options)
	}

	emit(eventName: keyof E, ...args: any[]): this
	emit(eventName: string | symbol, ...args: any[]): this
	emit(eventName: string | symbol, ...args: any[]): this {
		const callbackInfoArr = this.#eventMap[eventName]
		if (!callbackInfoArr) {
			logWarn(`eventName -> '${String(eventName)}' is not exist`)
			return this
		}

		for (let i = 0; i < callbackInfoArr.length; i++) {
			const { fn, once } = callbackInfoArr[i]
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
				callbackInfoArr.splice(i, 1)
				i--
			}
		}

		if (!callbackInfoArr.length) {
			delete this.#eventMap[eventName]
		}
		return this
	}

	off(eventName: keyof E, ref: symbol | Function): this {
		const callbackInfoArr = this.#eventMap[eventName]
		if (!callbackInfoArr) {
			logWarn(`eventName -> '${String(eventName)}' is not exist`)
			return this
		}

		let refField: 'sign' | 'fn'
		if (isSymbol(ref)) {
			refField = 'sign'
		} else if (isFunction(ref)) {
			refField = 'fn'
		} else {
			throw new TypeError('ref must be a symbol or function')
		}

		for (let i = 0; i < callbackInfoArr.length; i++) {
			if (callbackInfoArr[i][refField] === ref) {
				callbackInfoArr.splice(i, 1)
				i--
			}
		}

		if (!callbackInfoArr.length) {
			delete this.#eventMap[eventName]
		}
		return this
	}

	offBySign(sign: symbol): this {
		if (!isSymbol(sign)) {
			throw new TypeError('sign must be a symbol')
		}

		const eventMapKeys = Reflect.ownKeys(this.#eventMap)
		eventMapKeys.forEach((key) => {
			const callbackInfoArr = this.#eventMap[key] ?? []
			for (let i = 0; i < callbackInfoArr.length; i++) {
				if (callbackInfoArr[i].sign === sign) {
					callbackInfoArr.splice(i, 1)
					i--
				}
			}

			if (!callbackInfoArr.length) {
				delete this.#eventMap[key]
			}
		})

		return this
	}

	has(eventName: keyof E): boolean {
		return !!this.#eventMap[eventName]
	}

	hasCallback(eventName: keyof E, ref: symbol | Function): boolean {
		const callbackInfoArr = this.#eventMap[eventName]
		if (!callbackInfoArr) {
			return false
		}

		let refField: 'sign' | 'fn'
		if (isSymbol(ref)) {
			refField = 'sign'
		} else if (isFunction(ref)) {
			refField = 'fn'
		} else {
			throw new TypeError('ref must be a symbol or function')
		}

		return callbackInfoArr.some((callbackInfo) => callbackInfo[refField] === ref)
	}

	hasCallbackBySign(sign: symbol): boolean {
		const eventMapKeys = Reflect.ownKeys(this.#eventMap)
		for (let i = 0; i < eventMapKeys.length; i++) {
			const callbackInfoArr = this.#eventMap[eventMapKeys[i]]
			if (callbackInfoArr.some((callbackInfo) => callbackInfo.sign === sign)) {
				return true
			}
		}
		return false
	}
}

function logWarn(...args: any[]) {
	print.warn(...args)
}

function logError(...args: any[]) {
	print.error(...args)
}

const log = (() => {
	if (typeof console !== 'undefined') {
		return console
	} else {
		return {
			warn(...data: any[]) {
				throw new Error(
					`'console.warn()' not existent, 'eventBus()' prevent missing reminders, therefore throw Error ! ${String(
						data[0]
					)}`
				)
			},
			error(...data: any[]) {
				throw new Error(data[0])
			}
		}
	}
})()

const print = {
	warn(...data: any[]) {
		data[0] = `\x1b[33m${String(data[0])} \x1B[0m`
		log.warn(...data)
	},

	error(...data: any[]) {
		data[0] = `\x1b[31m${String(data[0])} \x1B[0m`
		log.error(...data)
	}
}
