import { sleep, omit, hasEmpty, hasInvalid } from '../index.js'

const target = {
	num: 1,
	num2: 0,
	num3: -0,
	// num4: Infinity,
	// num5: -Infinity,
	// num6: NaN,
	str: 'str',
	// str2: '',
	bool: false,
	bool2: true
	// und: undefined,
	// nu: null
}

console.log(
	hasInvalid(target, null, {
		// Infinity: false,
		// '-Infinity': false,
		// NaN: false,
		// undefined: false,
		// null: false,
		// 0: true,
		// '-0': true,
		// '': true,
		// str: true
	})
)
