import type { SessionStore } from '../types/index.js'
import { randomUUID } from 'crypto'

/**
 * 生成一个随机id
 */
export const createSessionId = () => {
	return `${randomUUID()}_${Date.now()}`
}

/**
 * 克隆一个符合 JSON 序列化的数据, 如果克隆失败将抛出错误
 * @param data 符合 JSON 序列化的结构数据
 */
export const Sessionclone = <T>(data: T): T => {
	return JSON.parse(JSON.stringify(data))
}

export const createStore = (): SessionStore => {
	const map = new Map()
	const store: SessionStore = {
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
