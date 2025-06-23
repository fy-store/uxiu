import type { Options } from './types/index.js'
import { isObject } from '../isObject/index.js'

/**
 * 数据库模型适配器
 */
export class DbFit<T extends Options = Options> {
	#isExec = false
	#tasks = []
	#result: Awaited<ReturnType<T['query']>>
	#execIndex: number = null
	#query: T['query']
	#isEnd = false

	/** 任务队列 */
	get $tasks() {
		return this.#tasks
	}

	/** 查询结果, 每个任务都将覆盖此结果 */
	get $result() {
		return this.#result
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
	$use(plugin: ((this: this, self: this) => any) | DbFit) {
		if (this.$isExec) {
			throw new Error('example only execute once')
		}
		if (plugin instanceof DbFit) {
			this.$tasks.push(() => {
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
			for (const task of this.#tasks) {
				if (this.$isEnd) {
					break
				}
				this.#execIndex++
				if (typeof task === 'function') {
					const result = await this.#query(task.call(this, this))
					this.#result = result
				} else {
					const result = await this.#query(...task)
					this.#result = result
				}
			}
		} catch (error) {
			throw error
		} finally {
			this.#isExec = true
			this.#isEnd = true
		}

		return this.#result
	}

	/** 结束任务 */
	$end() {
		if (this.$isExec) {
			throw new Error('example only execute once')
		}
		this.#isEnd = true
		return this
	}
}

/**
 * 创建 DbFit 实例工厂函数
 * @param optionsTemplate 配置选项
 */
export function createDbFit<T extends Options = Options>(optionsTemplate: T) {
	return class DbFitModel extends DbFit<T> {
		constructor(options?: Partial<T>) {
			super({ ...optionsTemplate, ...(options ?? {}) })
		}
	}
}
