import type { Options } from './types/index.js'
import type { DeepReadonly } from '@/utils/readonly/types/index.js'
import { isArray, isObject, readonly } from '@/utils/index.js'
import { clone, createId, createStore } from './utils/index.js'
export * from './types/index.js'
export { createId, clone }

/**
 * 创建一个会话存储实例
 */
export const createSessionStore = (options: Options = {}) => {
	if (!isObject(options)) {
		throw new Error('options must be an object')
	}

	const { store = createStore(), load = [] } = options

	if (!isObject(load)) {
		throw new Error('options.store must be an object')
	}

	if (!isArray(load)) {
		throw new Error('options.load must be an array')
	}

	load.forEach(([id, value], i) => {
		if (!isObject(value)) {
			throw new Error(`load[${i}].value must be a object`)
		}
		store.set(id, clone(value))
	})

	const sessionStore = {
		/**
		 * 通过 id 获取数据
		 * - 如果不存在则抛出异常
		 * @param id 会话id
		 * @returns 只读的会话数据
		 */
		async get<T extends object>(id: string): Promise<DeepReadonly<T>> {
			const data = await store.get(id)
			if (!data) {
				throw new Error(`id -> '${String(id)}' is not exist`)
			}
			return readonly(data as T)
		},

		/**
		 * 判断一个指定 id 的数据是否存在
		 * @param id 会话id
		 */
		async has(id: string): Promise<boolean> {
			try {
				return Boolean(await sessionStore.get(id))
			} catch (error) {
				return false
			}
		},

		/**
		 * 设置一个指定 id 的数据
		 * @param id 会话id
		 * @param value 会话数据
		 * @returns 只读的新的会话数据
		 */
		async set<T extends object>(id: string, value: T): Promise<DeepReadonly<T>> {
			if (!(await sessionStore.has(id))) {
				throw new Error(`id -> '${String(id)}' is not exist`)
			}

			if (!isObject(value)) {
				throw new Error(`value -> '${String(value)}' must be a object`)
			}

			const data = clone(value)
			return readonly((await store.set(id, data)) as T)
		},

		/**
		 * 创建一个会话
		 * @param value 会话数据, 必须符合 JSON 序列化, 且必须是对象
		 * @returns 会话id
		 */
		async create(value: object): Promise<string> {
			if (!isObject(value)) {
				throw new Error(`value -> '${String(value)}' must be a object`)
			}
			const id = createId()
			await store.add(id, clone(value))
			return id
		},

		/**
		 * 对指定会话的数据进行操作
		 * @param id 会话id
		 * @param value 补丁数据
		 * @returns 只读的新的会话数据
		 */
		async patch<T extends object>(id: string, value: T): Promise<T> {
			try {
				const data = await sessionStore.get(id)
				const newData = { ...data, ...clone(value) }
				return (await sessionStore.set(id, newData)) as T
			} catch (error) {
				throw new Error(`id -> '${String(id)}' is not exist`)
			}
		},

		/**
		 * 删除一个指定会话
		 * @param id 会话id
		 * @returns 被删除的会话数据
		 */
		async del<T extends object>(id: string): Promise<T> {
			if (!(await sessionStore.has(id))) {
				throw new Error(`id -> '${String(id)}' is not exist`)
			}
			return (await store.del(id)) as T
		},

		/**
		 * 删除一个指定会话
		 * - del 方法的别名
		 * @param id 会话id
		 * @returns 被删除的会话数据
		 */
		async delete<T extends object>(id: string): Promise<T> {
			return sessionStore.del(id)
		},

		/**
		 * 迭代会话仓库中的数据
		 * @param fn 回调函数
		 * - id 会话id
		 * - value 只读的会话数据
		 */
		async each(fn: (id: string, value: Readonly<object>) => void): Promise<void> {
			return await store.each((id, value) => {
				fn(id, readonly(value))
			})
		},

		/**
		 * 获取所有会话数据
		 * - 数据结构: [id, value][]
		 * - id 会话id
		 * - value 会话数据
		 * @returns 一个只读的会话数据列表
		 */
		async all() {
			const data = []
			await sessionStore.each((id, value) => {
				data.push([id, value])
			})
			return readonly(data)
		},

		/**
		 * 获取所有会话key
		 * @returns 一个只读的会话key列表
		 */
		async keys() {
			const data = []
			await sessionStore.each((id) => {
				data.push(id)
			})
			return readonly(data)
		},

		/**
		 * 获取所有会话内容
		 * @returns 一个只读的会话内容列表
		 */
		async values() {
			const data = []
			await sessionStore.each((_id, value) => {
				data.push(value)
			})
			return readonly(data)
		},

		/**
		 * 清空所有会话数据
		 * @returns 被清空的会话数据列表
		 */
		async clear() {
			const data = []
			await sessionStore.each(async (id, value) => {
				data.push([id, value])
				await sessionStore.del(id)
			})
			return data
		},

		/**
		 * 获取会话数据的数量(长度)
		 */
		async length() {
			return await store.length()
		}
	}

	return sessionStore
}
