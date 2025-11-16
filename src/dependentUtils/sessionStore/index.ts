import type { SessionStoreOptions, SessionStoreStore } from './types.js'
import type { ReadonlyDeep } from '../../utils/readonly/types/index.js'
import { randomUUID } from 'crypto'
import { isArray, isObject, readonly } from '../../utils/index.js'
export * from './types.js'

export class SessionStore {
	/**
	 * 创建一个会话存储实例
	 */
	create<T extends object>(options: SessionStoreOptions<T> = {}) {
		const self = this
		if (!isObject(options)) {
			throw new Error('options must be an object')
		}

		const { store = this.createMemoryStoreOptions(), load = [] } = options

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
			store.set(id, this.sessionclone(value))
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

				const data = self.sessionclone(value)
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
				const id = self.createSessionId()
				await store.add(id, self.sessionclone(value))
				return id
			},

			/**
			 * 自定义创建一个会话
			 * @param id 会话id
			 * @param value 会话内容
			 * @returns 会话id
			 */
			async customCreate<T1 extends object = T>(id: string, value: T1): Promise<string> {
				if (typeof id !== 'string' || id.trim() === '') {
					throw new Error(`id -> '${String(id)}' must be a non empty string`)
				}
				if (!isObject(value)) {
					throw new Error(`value -> '${String(value)}' must be a object`)
				}
				await store.add(id, self.sessionclone(value))
				return id
			},

			/**
			 * 对指定会话的数据进行操作
			 * @param id 会话id
			 * @param value 补丁数据
			 * @returns 只读的新的会话数据
			 */
			async patch<T1 extends object = T>(id: string, value: T1): Promise<T1> {
				let data = await sessionStore.get(id)
				if (!data) {
					throw new Error(`id -> '${String(id)}' is not exist`)
				}
				const newData = { ...data, ...self.sessionclone(value) }
				return (await sessionStore.set(id, newData)) as T1
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
				return await store.each((id: string, value) => {
					fn(id, readonly(value as T1))
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
				const data: any[] = []
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
				const data: any[] = []
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
				const data: any[] = []
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
				const data: any[] = []
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

	/**
	 * 生成一个新的会话id
	 * @returns 会话id
	 */
	createSessionId(): string {
		return `${randomUUID()}-${Date.now()}`
	}

	/**
	 * 克隆一个符合 JSON 序列化的数据, 如果克隆失败将抛出错误
	 * @param data 符合 JSON 序列化的结构数据
	 */
	sessionclone<T extends any>(data: T): T {
		return JSON.parse(JSON.stringify(data))
	}

	/**
	 * 创建一个内存存储器配置
	 */
	createMemoryStoreOptions(): SessionStoreStore {
		const map = new Map()
		const store: SessionStoreStore = {
			async add(id, value) {
				map.set(id, value)
				return map.get(id)
			},
			async get(id) {
				return map.get(id)
			},

			async set(id, value) {
				map.set(id, value)
				return map.get(id)
			},

			async del(id) {
				const data = map.get(id)
				map.delete(id)
				return data
			},

			async length() {
				return map.size
			},

			async each(fn) {
				for (const [id, value] of map) {
					fn(id, value)
				}
			}
		}

		return store
	}

	/**
	 * create 的别名
	 * @deprecated 请使用 create 方法
	 */
	createSessionStore<T extends object>(options: SessionStoreOptions<T> = {}) {
		return this.create<T>(options)
	}
}

/**
 * 默认的会话存储实例
 * @description 请使用 new SessionStore() 创建新的实例
 */
export const session = new SessionStore()
