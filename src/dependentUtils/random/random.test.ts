import { describe, it, expect } from 'vitest'
import { random } from './index.js'

describe('random()', () => {
	it('生成随机整数', () => {
		const result = random(0, 10)
		expect(result).toBeGreaterThanOrEqual(0)
		expect(result).toBeLessThan(10)
	})

	it('生成随机字符串', () => {
		const str = random.randomStr(10)
		expect(str).toHaveLength(10)
	})

	it('生成随机字符串使用自定义字符列表', () => {
		const customList = ['A', 'B', 'C', '1', '2', '3']
		const str = random.randomStr(15, customList)
		expect(str).toHaveLength(15)
		for (const char of str) {
			expect(customList).toContain(char)
		}
	})

	it('生成随机字符a-z', () => {
		const str = random.random26az(10)
		expect(str).toHaveLength(10)
		for (const char of str) {
			expect(random.az).toContain(char)
		}
	})

	it('生成随机字符A-Z', () => {
		const str = random.random26AZ(10)
		expect(str).toHaveLength(10)
		for (const char of str) {
			expect(random.AZ).toContain(char)
		}
	})

	it('生成随机字符0-z', () => {
		const str = random.random0toaz(10)
		expect(str).toHaveLength(10)
		for (const char of str) {
			expect([...random.num, ...random.az]).toContain(char)
		}
	})

	it('生成随机字符0-Z', () => {
		const str = random.random0toaZ(10)
		expect(str).toHaveLength(10)
		for (const char of str) {
			expect([...random.num, ...random.az, ...random.AZ]).toContain(char)
		}
	})
})
