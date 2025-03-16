import { test, expect } from 'vitest'
import { extract } from '../index.js'

test('extract()', () => {
	const prototype = { c: 3 }
	type Data = { a: number; b: number; c: number }
	const target = { a: 1, b: 2 } as unknown as Data
	Object.setPrototypeOf(target, prototype)
	const result = extract<Data, keyof Data>(target, ['a', 'b', 'c'])
	expect(result).toStrictEqual({ a: 1, b: 2, c: 3 })
})

test('extract() not prototype', () => {
	const prototype = { c: 3 }
	type Data = { a: number; b: number; c: number }
	const target = { a: 1, b: 2 } as unknown as Data
	Object.setPrototypeOf(target, prototype)
	const result = extract<Data, keyof Data>(target, ['a', 'b', 'c'], { containPrototype: false })
	expect(result).toStrictEqual({ a: 1, b: 2, c: void 0 })
})

test('extract() not prototype notValueWriteUndefined set false', () => {
	const prototype = { c: 3 }
	type Data = { a: number; b: number; c: number }
	const target = { a: 1, b: 2 } as unknown as Data
	Object.setPrototypeOf(target, prototype)
	const result = extract<Data, keyof Data>(target, ['a', 'b', 'c'], {
		containPrototype: false,
		notValueWriteUndefined: false
	})
	expect(result).toStrictEqual({ a: 1, b: 2 })
})
