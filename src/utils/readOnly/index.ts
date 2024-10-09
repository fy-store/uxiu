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

const arr = readOnly([1, 2, 3], { mode: 'limitedThis' })

// arr.at = 1

console.log(arr.at(0))
