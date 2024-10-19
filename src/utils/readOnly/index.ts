import { currency, limitedThis } from './createReadOnly.js'
import { type Options } from './types/index.js'

export const readOnly = <T extends object>(data: T, options: Options = {}): T => {
	const { mode = 'currency', tip = 'error' } = options
	if (mode === 'currency') {
		return currency(data, tip)
	}

	if (mode === 'limitedThis') {
		return limitedThis(data, tip)
	}
}
const list = [1, 2, 3]
list.say = () => {
	console.log(this)
	return 'say'
}
const arr = readOnly(list, { mode: 'currency' })
list.say.a = {
	field: 123
}

// arr.at.a = 1
arr.say.a.b = 234
console.log(list.say.a, arr.say.a)
// console.log('结果 => ', arr.say === list.say)
