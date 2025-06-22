import Event from '@yishu/event'
import { isObj } from '../isObj/index.js'

export class DbFit extends Event<any> {
	_$getSelf: () => this

	#tasks = []

	#result = null

	get _$tasks() {
		return this.#tasks
	}

	get $result() {
		return this.#result
	}

	constructor() {
		super()
	}

	/**
	 * 执行查询
	 * @param sql SQL语句
	 * @param params 查询参数
	 */
	$query(sql: string, params: any[] = []) {
		this.#tasks.push([sql, params])
		return this
	}

	/**
	 * 使用插件
	 * @param plugin 插件, 可以是一个函数或 DbFit 的实例
	 */
	$use(plugin: ((this: this) => void) | DbFit) {
		if (plugin instanceof DbFit || typeof plugin === 'function') {
			this.#tasks.push(plugin)
		} else {
			throw new TypeError('plugin must be a function or an instance of DbFit')
		}
		return this
	}

	async $exec() {
		for (const task of this.#tasks) {
			if (isObj(task)) {
				const [result] = await this.emitLineUp(Symbol(), task)
				this.#result = result
			} else if (typeof task === 'function') {
				const [result] = await this.emitLineUp(Symbol(), task)
				this.#result = result
			} else if (task instanceof DbFit) {
                
                task._$tasks
				const [result] = await this.emitLineUp(Symbol(), task)
				this.#result = result
			}
		}
		return this.#result
	}
}

function createDbFit() {
	return class DbFitModel extends DbFit {
		constructor() {
			super()
		}
	}
}

const dbFit = createDbFit()

class Child extends dbFit {
	constructor() {
		super()
	}

	get() {
		return this.$query('SELECT * FROM users', [])
	}

	set() {
		return this.$query('INSERT INTO users (name, age) VALUES (?, ?)', ['Alice', 30])
	}
}

const child = new Child()

child.get().set().$use(child.get()).$exec()
