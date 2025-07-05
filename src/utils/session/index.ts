import type { SessionOptions } from './types/index.js'
import type { ReadonlyDeep } from '../readonly/types/index.js'
import { isArray, isObject, readonly } from '../index.js'
import { Sessionclone, createSessionId, createStore } from './utils/index.js'
export { createSessionId, Sessionclone }
export * from './types/index.js'

/**
 * 创建一个会话存储实例
 */
export const createSessionStore = <T extends object>(options: SessionOptions<T> = {}) => {
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
		store.set(id, Sessionclone(value))
	})

	const sessionStore = {
		/**
		 * 通过 id 获取数据
		 * - 如果不存在则抛出异常
		 * @param id 会话id
		 * @returns 只读的会话数据
		 */
		async get<T1 extends object = T>(id: string): Promise<ReadonlyDeep<T1>> {
			const data = await store.get(id)
			if (!data) {
				throw new Error(`id -> '${String(id)}' is not exist`)
			}
			return readonly(data as T1)
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
		async set<T1 extends object = T>(id: string, value: T1): Promise<ReadonlyDeep<T1>> {
			if (!(await sessionStore.has(id))) {
				throw new Error(`id -> '${String(id)}' is not exist`)
			}

			if (!isObject(value)) {
				throw new Error(`value -> '${String(value)}' must be a object`)
			}

			const data = Sessionclone(value)
			return readonly((await store.set(id, data)) as T1)
		},

		/**
		 * 创建一个会话
		 * @param value 会话数据, 必须符合 JSON 序列化, 且必须是对象
		 * @returns 会话id
		 */
		async create<T1 extends object = T>(value: T1): Promise<string> {
			if (!isObject(value)) {
				throw new Error(`value -> '${String(value)}' must be a object`)
			}
			const id = createSessionId()
			await store.add(id, Sessionclone(value))
			return id
		},

		/**
		 * 对指定会话的数据进行操作
		 * @param id 会话id
		 * @param value 补丁数据
		 * @returns 只读的新的会话数据
		 */
		async patch<T1 extends object = T>(id: string, value: T1): Promise<T1> {
			try {
				const data = await sessionStore.get(id)
				const newData = { ...data, ...Sessionclone(value) }
				return (await sessionStore.set(id, newData)) as T1
			} catch (error) {
				throw new Error(`id -> '${String(id)}' is not exist`)
			}
		},

		/**
		 * 删除一个指定会话
		 * @param id 会话id
		 * @returns 被删除的会话数据
		 */
		async del<T1 extends object = T>(id: string): Promise<T1> {
			if (!(await sessionStore.has(id))) {
				throw new Error(`id -> '${String(id)}' is not exist`)
			}
			return (await store.del(id)) as T1
		},

		/**
		 * 删除一个指定会话
		 * - del 方法的别名
		 * @param id 会话id
		 * @returns 被删除的会话数据
		 */
		async delete<T1 extends object = T>(id: string): Promise<T1> {
			return sessionStore.del(id)
		},

		/**
		 * 迭代会话仓库中的数据
		 * @param fn 回调函数
		 * - id 会话id
		 * - value 只读的会话数据
		 */
		async each<T1 extends object = T>(fn: (id: string, value: ReadonlyDeep<T1>) => void): Promise<void> {
			return await store.each((id, value) => {
				fn(id, readonly(value) as ReadonlyDeep<T1>)
			})
		},

		/**
		 * 获取所有会话数据
		 * - 数据结构: [id, value][]
		 * - id 会话id
		 * - value 会话数据
		 * @returns 一个只读的会话数据列表
		 */
		async all<T1 extends object = T>(): Promise<ReadonlyDeep<T1[]>> {
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
		async keys(): Promise<ReadonlyDeep<string[]>> {
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
		async values<T1 extends object = T>(): Promise<ReadonlyDeep<T1[]>> {
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
		async clear<T1 extends object = T>(): Promise<ReadonlyDeep<T1[]>> {
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
