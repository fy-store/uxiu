import { describe, it, expect } from 'vitest'
import { create, check } from '../inspector/index.js'

describe('inspector', () => {
	it('create() and check()', () => {
		const rules = create(
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

		expect(check(rules, 'GET', '/api/a')).toBe(true)
		expect(check(rules, 'GET', '/api/b//info')).toBe(true)
		expect(check(rules, 'GET', '/api/b/a/info')).toBe(true)
		expect(check(rules, 'PUT', '/api/a')).toBe(true)
		expect(check(rules, 'DELETE', '/api/d1')).toBe(true)
		expect(check(rules, 'PATCH', '/api/e/1')).toBe(true)
	})
})
