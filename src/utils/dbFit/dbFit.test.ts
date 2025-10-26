import { describe, it, expect } from 'vitest'
import { DbFit } from './index.js'
import type { DbFitOptions } from './types.js'

describe('new DbFit()', () => {
	it('初始化使用', async () => {
		class Admin extends DbFit<{
			query: (sql: string, p: Record<string, any>) => Promise<any>
		}> {
			constructor() {
				super({
					query(sql, p) {
						return Promise.resolve({ name: 'test' })
					}
				})
			}

			get(id: number) {
				return this.query<{ name: string }>('select * from admin where id = :id', { id })
			}
		}

		const admin = new Admin()
		expect(admin.queryCount).toBe(0)
		const result = await admin.get(1)
		expect(result.name).toBe('test')
		expect(admin.isDestroyed).toBe(false)
		await admin.destroy()
		expect(admin.isDestroyed).toBe(true)
		expect(admin.queryCount).toBe(1)
	})

	it('监听事件使用', async () => {
		class Admin extends DbFit<{
			query: (sql: string, p: Record<string, any>) => Promise<any>
		}> {
			constructor() {
				super({
					query(sql, p) {
						return Promise.resolve({ name: 'test' })
					}
				})
			}

			get(id: number) {
				return this.query<{ name: string }>('select * from admin where id = :id', { id })
			}
		}

		const admin = new Admin()

		const eventResult = {
			firstQuery: false,
			hookFirstQuery: false,
			beforeQuery: false,
			hookBeforeQuery: false,
			afterQuery: false,
			hookAfterQuery: false,
			destroy: false,
			hookDestroy: false
		}

		admin.bus.on('firstQuery', () => {
			eventResult.firstQuery = true
		})

		admin.bus.on('hook:firstQuery', () => {
			eventResult.hookFirstQuery = true
		})

		admin.bus.on('beforeQuery', () => {
			eventResult.beforeQuery = true
		})

		admin.bus.on('hook:beforeQuery', () => {
			eventResult.hookBeforeQuery = true
		})

		admin.bus.on('afterQuery', () => {
			eventResult.afterQuery = true
		})

		admin.bus.on('hook:afterQuery', () => {
			eventResult.hookAfterQuery = true
		})

		admin.bus.on('destroy', () => {
			eventResult.destroy = true
		})

		admin.bus.on('hook:destroy', () => {
			eventResult.hookDestroy = true
		})

		await admin.get(1)
		await admin.submit()

		expect(eventResult).toEqual({
			firstQuery: true,
			hookFirstQuery: true,
			beforeQuery: true,
			hookBeforeQuery: true,
			afterQuery: true,
			hookAfterQuery: true,
			destroy: true,
			hookDestroy: true
		})
	})

	it('拓展自定义事件使用', async () => {
		type Ex<T> = {
			say?(self: T, msg: string): void
		}

		class Admin extends DbFit<
			{
				query: (sql: string, p: Record<string, any>) => Promise<any>
			},
			Ex<Admin>
		> {
			constructor() {
				super({
					query(sql, p) {
						return Promise.resolve({ name: 'test' })
					}
				})
			}
		}

		const admin = new Admin()
		let msgResult = ''
		admin.bus.on('say', (_self, msg) => {
			msgResult = msg
		})
		admin.bus.emit('say', admin, 'hello')
		expect(msgResult).toBe('hello')
	})

	it('使用 catchErrorProxy() 捕获错误', async () => {
		class Admin extends DbFit<{
			query: (sql: string, p: Record<string, any>) => Promise<any>
		}> {
			constructor() {
				super({
					query(sql, p) {
						return Promise.resolve({ name: 'test' })
					}
				})
				return DbFit.catchErrorProxy(this, (_, _err) => {
					this.destroy()
				})
			}

			testErr() {
				throw new Error('test error')
			}
		}

		const admin = new Admin()

		expect(() => {
			admin.testErr()
		}).toThrow('test error')

		expect(admin.isDestroyed).toBe(true)
	})

	it('使用 borrow 借用', async () => {
		class Admin extends DbFit<{
			query: (sql: string, p: Record<string, any>) => Promise<any>
		}> {
			constructor(borrow?: DbFit) {
				super({
					query(sql, p) {
						return Promise.resolve({ name: 'admin' })
					},
					borrow
				} as DbFitOptions)
			}

			get(id: number) {
				return this.query<{ name: string }>('select * from admin where id = :id', { id })
			}
		}

		class User extends DbFit<{
			query: (sql: string, p: Record<string, any>) => Promise<any>
		}> {
			constructor(borrow?: DbFit) {
				super({
					query(sql, p) {
						return Promise.resolve({ name: 'user' })
					},
					borrow
				} as DbFitOptions)
			}

			get(id: number) {
				return this.query<{ name: string }>('select * from user where id = :id', { id })
			}
		}

		const admin = new Admin()
		const user = new User(admin)

		expect(admin.queryCount).toBe(0)
		expect(user.queryCount).toBe(0)

		const r1 = await admin.get(1)
		expect(r1.name).toBe('admin')
		expect(admin.queryCount).toBe(1)
		expect(user.queryCount).toBe(1)
		const r2 = await user.get(1)
		expect(r2.name).toBe('admin')
		expect(admin.queryCount).toBe(2)
		expect(user.queryCount).toBe(2)

		expect(user.borrow).toBe(admin)
		expect(user.bus).toBe(admin.bus)

		await user.destroy()
		expect(admin.isDestroyed).toBe(true)
		expect(user.isDestroyed).toBe(true)
	})
})
