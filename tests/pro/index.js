import { extract } from '../../src/index.js'

const prototype = {
	c: 3
}

const target = {
	a: 1,
	b: 2
}

Object.setPrototypeOf(target, prototype)
const result = extract(target, ['a', 'b', 'c'])
console.log(result)
