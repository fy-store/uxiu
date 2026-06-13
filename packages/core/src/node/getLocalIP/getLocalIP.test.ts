import { describe, it, expect } from 'vitest'
import { getLocalIP } from './index.js'

describe('getLocalIP()', () => {
	it('ip 列表', () => {
		const ips = getLocalIP()
		expect(Array.isArray(ips)).toBe(true)
	})

	it('主要 ip 地址', () => {
		const ip = getLocalIP.getPrimaryLocalIP()
		expect(typeof ip).toBe('string')
	})
})
