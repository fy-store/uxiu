import { describe, it, expect } from 'vitest'
import { createRequestInspector } from './index.js'

describe('createRequestInspector()', () => {
	it('创建和校验 create() 和 check()', async () => {
		const requestInspector = await createRequestInspector()
		const rules = requestInspector.create(
			[
				{
					methods: 'GET',
					path: 'a'
				},
				{
					methods: ['GET', 'POST'],
					path: 'b/*/info'
				},
				{
					methods: ['PUT'],
					path: '*'
				},
				{
					methods: ['DELETE'],
					path: '/d*'
				},
				{
					methods: ['PATCH'],
					path: '/e/*'
				}
			],
			{ base: '/api' }
		)

		expect(requestInspector.check(rules, 'GET', '/api/a')).toBe(true)
		expect(requestInspector.check(rules, 'GET', '/api/b//info')).toBe(true)
		expect(requestInspector.check(rules, 'GET', '/api/b/a/info')).toBe(true)
		expect(requestInspector.check(rules, 'PUT', '/api/a')).toBe(true)
		expect(requestInspector.check(rules, 'DELETE', '/api/d1')).toBe(true)
		expect(requestInspector.check(rules, 'PATCH', '/api/e/1')).toBe(true)
	})

	it('序列化和反序列化 serialize() 和 deserialize()', async () => {
		const requestInspector = await createRequestInspector()
		const rules = requestInspector.create(
			[
				{
					methods: 'GET',
					path: 'a'
				},
				{
					methods: ['GET', 'POST'],
					path: 'b/*/info'
				},
				{
					methods: ['PUT'],
					path: '*'
				},
				{
					methods: ['DELETE'],
					path: '/d*'
				},
				{
					methods: ['PATCH'],
					path: '/e/*'
				}
			],
			{ base: '/api' }
		)
		const serialized = requestInspector.rulesToSerialize(rules)
		const deserialized = requestInspector.serializeToRules(serialized)
		expect(deserialized).toEqual(rules)
	})

	it('使用 null 配置', async () => {
		const requestInspector = await createRequestInspector()
		const rules = requestInspector.create<{ id: string }>([
			{ methods: null, path: null, meta: { id: 'view' } },
			{ methods: 'GET', path: '/admin', meta: { id: 'admin' } }
		])

		expect(rules.length).toBe(2)
		expect(requestInspector.check(rules, null, null)).toBe(false)
		expect(requestInspector.check(rules, 'GET', '/admin')).toBe(true)
		const serialized = requestInspector.rulesToSerialize(rules)
		const deserialized = requestInspector.serializeToRules(serialized)
		expect(deserialized).toEqual(rules)
	})
})
