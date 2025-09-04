import type { DbFitEventType, DbFitOptions } from './types/index.js'
import { isObject } from '../isObject/index.js'
import { readonly } from '../readonly/index.js'
import Event from '@yishu/event'
export * from './types/index.js'

/**
 * 数据库模型适配器
 */
export class DbFit<T extends DbFitOptions = DbFitOptions, Result = Awaited<ReturnType<T['query']>>> {
	#isExec = false
	#tasks = []
	#execIndex: number
	#query: T['query']
	#isEnd = false
	#isRuntime = false
	/** 查询结果, 每个任务都将覆盖此结果 */
	$result: Result

	/** 当前实例是否正在运行 exec */
	get $isRuntime() {
		return this.#isRuntime
	}

	/** 任务队列 */
	get $tasks() {
		return readonly(this.#tasks)
	}

	/** 当前实例是否已经执行 */
	get $isExec() {
		return this.#isExec
	}

	// /** 设置当前实例是否已经执行状态 */
	// set $isExec(value: boolean) {
	// 	if (!this.#isExec) {
	// 		throw new Error('example $isExec is true, cannot set to false')
	// 	}
	// 	this.#isExec = !!value
	// }

	/** 当前执行的任务下标 */
	get $execIndex() {
		return this.#execIndex
	}

	/** 当前实例是否已经结束 */
	get $isEnd() {
		return this.#isEnd
	}

	#event: Event<DbFitEventType>

	/** 事件实例 */
	get $event() {
		return this.#event
	}

	/**
	 * 数据库模型适配器
	 * @param options 配置选项
	 */
	constructor(options: T) {
		this.#event = new Event<DbFitEventType>({ events: options.events })
		if (!isObject(options)) {
			throw new TypeError('options must be an object')
		}

		if (typeof options.query === 'function') {
			this.#query = options.query
		} else {
			throw new TypeError('options.query must be a function')
		}
	}

	/**
	 * 立即执行一个任务且不插入队列
	 * @param fn 任务方法
	 * @param args 任务参数
	 */
	async $run<R extends (...args: any[]) => any>(fn: R, ...args: Parameters<R>): Promise<ReturnType<R>['$result']> {
		if (this.$isExec) {
			throw new Error('example only execute once, current example is ended')
		}

		const query = async (...args: any[]) => {
			return await this.#query(...args)
		}

		return await fn.call(
			new Proxy(this, {
				get(target, prop, receiver) {
					if (prop === '$query') {
						return query
					}
					return Reflect.get(target, prop, receiver)
				}
			}),
			...args
		)
	}

	/**
	 * 执行查询
	 * - 泛型参数:
	 * - `R` 可任意类型, 将作为 $result 和 $exec() 返回值类型, 默认为 `Awaited<ReturnType<T['query']>>` [可选]
	 */
	$query<R = Awaited<ReturnType<T['query']>>>(
		...args: Parameters<T['query']>
	): Omit<this, '$result' | '$exec'> & {
		$result: R
		$exec(): Promise<R>
	} {
		if (this.$isExec) {
			throw new Error('example only execute once, current example is ended')
		}

		if (this.#isRuntime) {
			throw new Error('example is running, cannot add new query, please use $run()')
		}
		this.#tasks.push(args)
		return this as any
	}

	/**
	 * 设置查询函数
	 * @param query 查询函数
	 */
	$setQuery(query: T['query']) {
		if (this.$isExec) {
			throw new Error('example only execute once, current example is ended')
		}
		if (typeof query !== 'function') {
			throw new TypeError('query must be a function')
		}
		this.#query = query
		return this
	}

	/**
	 * 设置 $result
	 * - 通过该方法设置, 避免类型警告
	 */
	$setResult<S extends any, R = S>(
		value: S
	): Omit<this, '$result' | '$exec'> & {
		$result: R
		$exec(): Promise<R>
	} {
		this.$result = value as any
		return this as any
	}

	/**
	 * 使用中间件
	 * - 注意: 中间件将被插入到任务队列末端(使用 push())
	 * @param middleware 中间件, 可以是一个函数或 DbFit 的实例
	 * - 泛型参数:
	 * - `S` 应传递类上的方法类型, 例如 `Test['get']` 将作为 this 和 self 的类型, 建议传递已获取更好的类型上下文 [可选]
	 * - `R` 可任意类型, 将作为 $result 和 $exec() 返回值类型, 默认为 `ReturnType<S>['$result']` [可选]
	 */
	$use<S extends (...args: any[]) => any = () => this, R = ReturnType<S>['$result']>(
		middleware: ((this: ReturnType<S>, self: ReturnType<S>) => void) | DbFit
	): Omit<ReturnType<S>, '$result' | '$exec'> & {
		$result: R
		$exec(): Promise<R>
	} {
		if (this.$isExec) {
			throw new Error('example only execute once, current example is ended')
		}
		if (middleware instanceof DbFit) {
			this.#tasks.push(() => {
				middleware.$setQuery(this.#query)
				return middleware.$exec()
			})
		} else if (typeof middleware === 'function') {
			this.#tasks.push(middleware)
		} else {
			throw new TypeError('plugin must be a function or an instance of DbFit')
		}
		return this as any
	}

	/**
	 * 执行任务
	 * @returns 最后一个任务的执行结果
	 * - 泛型参数:
	 * - `R` 可任意类型, 将作为 $exec() 返回值类型, 默认为 `any` , 如果上一个方法有提供上下文将自动覆盖 [可选]
	 */
	async $exec<R = any>(): Promise<R> {
		if (this.$isExec) {
			throw new Error('example only execute once, current example is ended')
		}
		try {
			this.#execIndex = 0
			this.#isRuntime = true
			if (this.#event.has('hook:beforeExec')) {
				await this.#event.emitLineUp('hook:beforeExec', this)
			}
			for (const task of this.#tasks) {
				if (this.$isEnd) {
					break
				}

				if (typeof task === 'function') {
					await task.call(this, this)
				} else {
					if (this.#event.has('hook:beforeQuery')) {
						await this.#event.emitLineUp('hook:beforeQuery', this)
					}
					const result = await this.#query(...task)
					this.$result = result
					if (this.#event.has('hook:afterQuery')) {
						this.#event.emit('hook:afterQuery', this)
					}
				}
				this.#execIndex++
			}
			if (this.#event.has('hook:afterExec')) {
				await this.#event.emitLineUp('hook:afterExec', this)
			}
		} catch (error) {
			if (this.#event.has('hook:execError')) {
				await this.#event.emitLineUp('hook:execError', this, error)
			} else {
				throw error
			}
		} finally {
			this.#isRuntime = false
			this.#isExec = true
			this.#isEnd = true
			if (this.#event.has('hook:end')) {
				await this.#event.emitLineUp('hook:end', this)
			}
		}

		return this.$result as unknown as R
	}

	/** 结束任务 */
	async $end() {
		if (this.$isExec) {
			throw new Error('example only execute once, current example is ended')
		}
		this.#isEnd = true
		if (this.#event.has('hook:callEnd')) {
			await this.#event.emitLineUp('hook:callEnd', this)
		}
		return this
	}
}

/**
 * 创建 DbFit 实例工厂函数
 * @param optionsTemplate 配置选项
 * @deprecated 生成的 .d.ts 类型不正确, 推荐自定义工厂函数保证开发环境类型正确
 */
export function createDbFit<T extends DbFitOptions = DbFitOptions>(optionsTemplate: T) {
	return class DbFitModel extends DbFit<T> {
		constructor(options?: Partial<T>) {
			super({ ...optionsTemplate, ...(options ?? {}) })
		}
	}
}
