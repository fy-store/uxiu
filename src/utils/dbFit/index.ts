import type { DbFitEventType, DbFitOptions } from './types/index.js'
import { isObject } from '../isObject/index.js'
import { readonly } from '../readonly/index.js'
import Event from '@yishu/event'
export * from './types/index.js'

/**
 * 数据库模型适配器
 */
export class DbFit<T extends DbFitOptions = DbFitOptions> extends Event<DbFitEventType> {
	#isExec = false
	#tasks = []
	#execIndex: number = null
	#query: T['query']
	#isEnd = false
	/** 查询结果, 每个任务都将覆盖此结果 */
	$result: Awaited<ReturnType<T['query']>>

	/** 任务队列 */
	get $tasks() {
		return readonly(this.#tasks)
	}

	/** 当前实例是否已经执行 */
	get $isExec() {
		return this.#isExec
	}

	/** 设置当前实例是否已经执行状态 */
	set $isExec(value: boolean) {
		if (!this.#isExec) {
			throw new Error('example $isExec is true, cannot set to false')
		}
		this.#isExec = !!value
	}

	/** 当前执行的任务下标 */
	get $execIndex() {
		return this.#execIndex
	}

	/** 当前实例是否已经结束 */
	get $isEnd() {
		return this.#isEnd
	}

	/**
	 * 数据库模型适配器
	 * @param options 配置选项
	 */
	constructor(options: T) {
		super({ events: options.events })
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
	 * 执行查询
	 */
	$query(...args: Parameters<T['query']>) {
		if (this.$isExec) {
			throw new Error('example only execute once')
		}
		this.#tasks.push(args)
		return this
	}

	/**
	 * 设置查询函数
	 * @param query 查询函数
	 */
	$setQuery(query: T['query']) {
		if (this.$isExec) {
			throw new Error('example only execute once')
		}
		if (typeof query !== 'function') {
			throw new TypeError('query must be a function')
		}
		this.#query = query
		return this
	}

	/**
	 * 使用插件
	 * @param plugin 插件, 可以是一个函数或 DbFit 的实例
	 */
	$use(plugin: ((this: this, self: this) => void) | DbFit) {
		if (this.$isExec) {
			throw new Error('example only execute once')
		}
		if (plugin instanceof DbFit) {
			this.#tasks.push(() => {
				plugin.$setQuery(this.#query)
				return plugin.$exec()
			})
		} else if (typeof plugin === 'function') {
			this.#tasks.push(plugin)
		} else {
			throw new TypeError('plugin must be a function or an instance of DbFit')
		}
		return this
	}

	/**
	 * 执行任务
	 * @returns 最后一个任务的执行结果
	 */
	async $exec<R = Awaited<ReturnType<T['query']>>>(): Promise<R> {
		if (this.$isExec) {
			throw new Error('example only execute once')
		}
		try {
			this.#execIndex = 0
			if (this.has('hook:beforeExec')) {
				await this.emitLineUp('hook:beforeExec', this)
			}
			for (const task of this.#tasks) {
				if (this.$isEnd) {
					break
				}

				if (typeof task === 'function') {
					await task.call(this, this)
				} else {
					if (this.has('hook:beforeQuery')) {
						await this.emitLineUp('hook:beforeQuery', this)
					}
					const result = await this.#query(...task)
					this.$result = result
					if (this.has('hook:afterQuery')) {
						this.emit('hook:afterQuery', this)
					}
				}
				this.#execIndex++
			}
			if (this.has('hook:afterExec')) {
				await this.emitLineUp('hook:afterExec', this)
			}
		} catch (error) {
			if (this.has('hook:execError')) {
				await this.emitLineUp('hook:execError', this, error)
			} else {
				throw error
			}
		} finally {
			this.#isExec = true
			this.#isEnd = true
			if (this.has('hook:end')) {
				await this.emitLineUp('hook:end', this)
			}
		}

		return this.$result
	}

	/** 结束任务 */
	async $end() {
		if (this.$isExec) {
			throw new Error('example only execute once')
		}
		this.#isEnd = true
		if (this.has('hook:callEnd')) {
			await this.emitLineUp('hook:callEnd', this)
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
