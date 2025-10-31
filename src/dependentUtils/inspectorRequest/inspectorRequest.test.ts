import { describe, it, expect } from 'vitest'
import { InspectorRequest } from './index.js'

describe('new InspectorRequest()', () => {
	it('创建和校验 create() 和 check()', () => {
		const inspectorRequest = new InspectorRequest()
		const rules = inspectorRequest.create(
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

		expect(inspectorRequest.check(rules, 'GET', '/api/a')).toBe(true)
		expect(inspectorRequest.check(rules, 'GET', '/api/b//info')).toBe(true)
		expect(inspectorRequest.check(rules, 'GET', '/api/b/a/info')).toBe(true)
		expect(inspectorRequest.check(rules, 'PUT', '/api/a')).toBe(true)
		expect(inspectorRequest.check(rules, 'DELETE', '/api/d1')).toBe(true)
		expect(inspectorRequest.check(rules, 'PATCH', '/api/e/1')).toBe(true)
	})

	it('序列化和反序列化 serialize() 和 deserialize()', () => {
		const inspectorRequest = new InspectorRequest()
		const rules = inspectorRequest.create(
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
		const serialized = inspectorRequest.rulesToSerialize(rules)
		const deserialized = inspectorRequest.serializeToRules(serialized)
		expect(deserialized).toEqual(rules)
	})
})
