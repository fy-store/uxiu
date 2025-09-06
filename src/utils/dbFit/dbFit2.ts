import type { DbFitEvents, DbFit2Options } from './types/index.js'
import Bus from '@yishu/event'

/**
 * 数据库适配器 v2
 */
export class DbFit2<O extends DbFit2Options = DbFit2Options, E extends Record<string, (...args: any[]) => any> = {}> {
	private _bus: Bus<DbFitEvents<this>>
	private _query: O['query']
	private _queryCount = 0
	private _isDestroyed = false
	private _borrow?: DbFit2

	/** 事件总线 */
	get bus(): Bus<DbFitEvents<this> & E> {
		return this._bus as Bus<DbFitEvents<this> & E>
	}

	/** query 调用次数, 初始化为 0 */
	get queryCount(): number {
		if (this._borrow) {
			return this._borrow.queryCount
		}
		return this._queryCount
	}

	/** 实例是否已被销毁 */
	get isDestroyed(): boolean {
		if (this._borrow) {
			return this._borrow.isDestroyed
		}
		return this._isDestroyed
	}

	/** 借用的实例 */
	get borrow(): DbFit2 | undefined {
		return this._borrow
	}

	/**
	 * 实例化适配器
	 * @param options 配置选项
	 */
	constructor(options: O) {
		if (!(typeof options === 'object' && options !== null)) {
			throw new TypeError('DbFit options must be an object')
		}

		if (typeof options.query !== 'function') {
			throw new TypeError('DbFit options.query must be a function')
		}

		if (options.borrow) {
			if (!(options.borrow instanceof DbFit2)) {
				throw new TypeError('DbFit options.borrow must be an instance of DbFit')
			}
			this._borrow = options.borrow
			this._query = options.borrow.query.bind(options.borrow)
			this._bus = options.borrow.bus
		} else {
			this._query = options.query
			this._bus = new Bus()
		}
	}

	/**
	 * 执行查询
	 */
	async query<T = ReturnType<O['query']>>(...args: Parameters<O['query']>): Promise<T> {
		if (this._borrow) {
			return this._borrow.query(...args)
		}

		if (this._isDestroyed) {
			throw new Error('DbFit instance has been destroyed')
		}

		this._queryCount++
		if (this._queryCount === 1) {
			if (this._bus.has('hook:firstQuery')) {
				await this._bus.emitWait('hook:firstQuery', this, ...args)
			}
			if (this._bus.has('firstQuery')) {
				this._bus.emit('firstQuery', this, ...args)
			}
		}

		if (this._bus.has('hook:beforeQuery')) {
			await this._bus.emitWait('hook:beforeQuery', this, ...args)
		}

		if (this._bus.has('beforeQuery')) {
			this._bus.emit('beforeQuery', this, ...args)
		}

		try {
			const result = await this._query(...args)
			if (this._bus.has('hook:afterQuery')) {
				await this._bus.emitWait('hook:afterQuery', this, ...args)
			}
			if (this._bus.has('afterQuery')) {
				this._bus.emit('afterQuery', this, ...args)
			}
			return result
		} catch (error) {
			if (this._bus.has('hook:destroy')) {
				await this._bus.emitWait('hook:destroy', this, {
					emitType: 'error',
					args,
					error
				})
			}
			if (this._bus.has('destroy')) {
				this._bus.emit('destroy', this, {
					emitType: 'error',
					args,
					error
				})
			}

			throw error
		}
	}

	/**
	 * 销毁实例
	 * @param emitEvent 是否触发 destroy 事件, 默认为 true
	 * @param args 传递给 destroy 事件的参数
	 */
	async destroy(emitEvent: boolean = true, ...args: any[]): Promise<boolean> {
		if (this._borrow) {
			return this._borrow.destroy(emitEvent, ...args)
		}
		if (this._isDestroyed) {
			return this._isDestroyed
		}
		this._isDestroyed = true

		if (emitEvent) {
			if (this._bus.has('hook:destroy')) {
				await this._bus.emitWait('hook:destroy', this, {
					emitType: 'callDestroy',
					args
				})
			}

			if (this._bus.has('destroy')) {
				this._bus.emit('destroy', this, {
					emitType: 'callDestroy',
					args
				})
			}
		}

		return this._isDestroyed
	}

	/**
	 * 提交查询
	 * @param args 传递给 destroy 和 hook:destroy 事件的参数
	 */
	async submit(...args: any[]): Promise<void> {
		if (this._borrow) {
			return this._borrow.submit(...args)
		}

		if (this._isDestroyed) {
			throw new Error('DbFit instance has been destroyed')
		}

		this._isDestroyed = true

		if (this._bus.has('hook:destroy')) {
			await this._bus.emitWait('hook:destroy', this, {
				emitType: 'callDestroy',
				args
			})
		}

		if (this._bus.has('destroy')) {
			this._bus.emit('destroy', this, {
				emitType: 'callDestroy',
				args
			})
		}
	}

	/**
	 * 错误代理, 只捕获错误, 不阻止抛出
	 * - 该方法适用于清理副作用, 如销毁实例
	 * @param self 被代理的对象
	 * @param errCallback 错误回调
	 */
	static catchErrorProxy<T extends object>(self: T, errCallback: (self: T, error: any, ...args: any[]) => void) {
		if (typeof self !== 'object' || self === null) {
			throw new TypeError('self must be an object')
		}

		if (typeof errCallback !== 'function') {
			throw new TypeError('errCallback must be a function')
		}

		return new Proxy(self, {
			get: (target, prop, receiver) => {
				try {
					const value = Reflect.get(target, prop, receiver)

					// 如果属性是函数，则包装它以捕获错误
					if (typeof value === 'function') {
						return (...args: any[]) => {
							try {
								const result = Reflect.apply(value, target, args)

								// 如果返回的是 Promise，需要捕获异步错误
								if (result && typeof result.then === 'function') {
									return result.catch((error: any) => {
										errCallback(self, error, ...args)
										throw error
									})
								}

								return result
							} catch (error) {
								// 捕获同步错误
								errCallback(self, error, ...args)
								throw error
							}
						}
					}

					return value
				} catch (error) {
					// 捕获属性访问时的错误（如方法不存在、访问被拒绝等）
					if (errCallback) {
						errCallback(self, error)
					}
					throw error
				}
			}
		})
	}
}
