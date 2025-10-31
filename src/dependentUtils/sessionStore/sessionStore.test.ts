import { describe, it, expect } from 'vitest'
import { SessionStore } from './index.js'

describe('new SessionStore()', () => {
	it('使用默认内存存储', async () => {
		type Session = { id: number; name: string }
		const sessionStore = new SessionStore().create<Session>()
		const id1 = await sessionStore.create({ id: 1, name: 'test' })
		const id2 = await sessionStore.create({ id: 2, name: 'test' })
		expect(await sessionStore.has(id1)).toBe(true)
		expect(await sessionStore.has(id2)).toBe(true)
		await sessionStore.patch(id1, { name: 'updated' })
		expect((await sessionStore.get(id1)).name).toBe('updated')
		expect(await sessionStore.length()).toBe(2)
		const list: { id: string; value: Session }[] = []
		await sessionStore.each((id, value) => {
			list.push({ id, value })
		})
		expect(list).toEqual([
			{ id: id1, value: { id: 1, name: 'updated' } },
			{ id: id2, value: { id: 2, name: 'test' } }
		])
		expect(await sessionStore.keys()).toEqual([id1, id2])
		expect(await sessionStore.values()).toEqual([
			{ id: 1, name: 'updated' },
			{ id: 2, name: 'test' }
		])
		await sessionStore.delete(id1)
		expect(await sessionStore.has(id1)).toBe(false)
		await sessionStore.clear()
		expect(await sessionStore.length()).toBe(0)
		const id3 = await sessionStore.create({ id: 3, name: 'test' })
		await sessionStore.set(id3, { id: 3, name: 'custom' })
		expect(await sessionStore.get(id3)).toEqual({ id: 3, name: 'custom' })
	})

	it('使用自定义存储', async () => {
		type Session = { id: number; name: string }
		const map = new Map<string, Session>()
		const sessionStore = new SessionStore().create<Session>({
			store: {
				get(id) {
					return Promise.resolve(map.get(id)!)
				},
				set(id, value) {
					map.set(id, value)
					return Promise.resolve(map.get(id)!)
				},
				del(id) {
					const result = map.get(id)
					map.delete(id)
					return Promise.resolve(result!)
				},
				add(id, value) {
					map.set(id, value)
					return Promise.resolve(map.get(id)!)
				},
				each(fn) {
					for (const [id, value] of map.entries()) {
						fn(id, value)
					}
					return Promise.resolve()
				},
				length() {
					return Promise.resolve(map.size)
				}
			}
		})
		const id1 = await sessionStore.create({ id: 1, name: 'test' })
		const id2 = await sessionStore.create({ id: 2, name: 'test' })
		expect(await sessionStore.has(id1)).toBe(true)
		expect(await sessionStore.has(id2)).toBe(true)
		await sessionStore.patch(id1, { name: 'updated' })
		expect((await sessionStore.get(id1)).name).toBe('updated')
		expect(await sessionStore.length()).toBe(2)
		const list: { id: string; value: Session }[] = []
		await sessionStore.each((id, value) => {
			list.push({ id, value })
		})
		expect(list).toEqual([
			{ id: id1, value: { id: 1, name: 'updated' } },
			{ id: id2, value: { id: 2, name: 'test' } }
		])
		expect(await sessionStore.keys()).toEqual([id1, id2])
		expect(await sessionStore.values()).toEqual([
			{ id: 1, name: 'updated' },
			{ id: 2, name: 'test' }
		])
		await sessionStore.delete(id1)
		expect(await sessionStore.has(id1)).toBe(false)
		await sessionStore.clear()
		expect(await sessionStore.length()).toBe(0)
		const id3 = await sessionStore.create({ id: 3, name: 'test' })
		await sessionStore.set(id3, { id: 3, name: 'custom' })
		expect(await sessionStore.get(id3)).toEqual({ id: 3, name: 'custom' })
	})
})
