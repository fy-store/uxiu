import { isArray } from '../isArray/index.js'
import { isBigint } from '../isBigint/index.js'
import { isBoolean } from '../isBoolean/index.js'
import { isEffectiveNumber } from '../isEffectiveNumber/index.js'
import { isEffectiveStrNumber } from '../isEffectiveStrNumber/index.js'
import { isFunction } from '../isFunction/index.js'
import { isNull } from '../isNull/index.js'
import { isNumber } from '../isNumber/index.js'
import { isObject } from '../isObject/index.js'
import { isString } from '../isString/index.js'
import { isSymbol } from '../isSymbol/index.js'
import { isUndefined } from '../isUndefined/index.js'
import type {
	CheckFieldOptions,
	CheckFieldConfs,
	CheckRequiredConf,
	CheckFieldConf,
	CheckTypeConf,
	CheckTypeExpect,
	CheckLengthConf,
	CheckRangeConf,
	CheckVerifyTypeMap,
	CheckHookOptions,
	CheckConfFiledList,
	CheckCustom
} from './types/index.js'

export const throwErr = (field: string, needType: string, fromIndex: number) => {
	throw new TypeError(
		`'fieldsOptions -> ${field ? 'item.' + field : ''}' must be a ${needType}, error from 'fieldsOptions[${fromIndex}]${
			field ? '.' + field : ''
		}'`
	)
}

export default (fieldsOptions: CheckFieldOptions[]): CheckFieldConfs[] => {
	const fieldConfs: CheckFieldConfs[] = []
	fieldsOptions.forEach((fieldOptions, i) => {
		if (!isObject(fieldOptions)) {
			throwErr('', 'object', i)
		}

		const field = parseField(fieldOptions, i)
		const required = parseRequired(fieldOptions, i)
		const requiredFail = parseRequiredFail(fieldOptions, i)
		const type = parseType(fieldOptions, i)
		const length = parseLength(fieldOptions, i)
		const range = parseRange(fieldOptions, i)
		const customs = parseCustoms(fieldOptions, i)

		fieldConfs.push({
			field,
			required,
			requiredFail,
			type,
			length,
			range,
			customs
		})
	})
	return fieldConfs
}

const parseField = ({ field }: CheckFieldOptions, i: number): CheckFieldConf => {
	if (!isString(field)) {
		throwErr('field', 'string', i)
	}
	return field
}

const parseRequired = ({ required }: CheckFieldOptions, i: number): CheckRequiredConf => {
	if (isUndefined(required)) {
		return true
	}

	if (!isBoolean(required)) {
		throwErr('field', 'boolean', i)
	}

	return required
}

const parseRequiredFail = ({ requiredFail, field }: CheckFieldOptions, i: number): string => {
	if (isUndefined(requiredFail)) {
		return `'${field}' is required`
	}

	if (!isString(requiredFail)) {
		throwErr('field', 'boolean', i)
	}

	return requiredFail
}

const typeExpect: CheckTypeExpect[] = [
	'any',
	'number',
	'effectiveNumber',
	'effectiveStrNumber',
	'effectiveStrInt',
	'effectiveStrPositiveInt',
	'string',
	'boolean',
	'null',
	'undefined',
	'array',
	'object',
	'symbol',
	'bigint',
	'function'
]

const checkTypeMap: CheckVerifyTypeMap = {
	any: () => true,
	number: isNumber,
	effectiveNumber: isEffectiveNumber,
	effectiveStrNumber: isEffectiveStrNumber,
	effectiveStrInt(data: any) {
		return isEffectiveStrNumber(data) && Number.isInteger(+data)
	},
	effectiveStrPositiveInt(data: any) {
		return isEffectiveStrNumber(data) && Number.isInteger(+data) && +data > 0
	},
	string: isString,
	boolean: isBoolean,
	null: isNull,
	undefined: isUndefined,
	array: isArray,
	object: isObject,
	symbol: isSymbol,
	bigint: isBigint,
	function: isFunction
}
const parseType = ({ type, field }: CheckFieldOptions, i: number): CheckTypeConf => {
	if (isUndefined(type)) {
		return {
			use: false,
			expect: ['any'],
			success: '',
			fail: '',
			checkFn: [checkTypeMap['any']],
			transform: void 0,
			verify: void 0
		}
	}

	if (!isObject(type)) {
		throwErr('type', 'object', i)
	}

	const { expect, success = '', fail = `'${field}' type must be a ${expect}`, transform, verify } = type
	let useExpect: CheckTypeExpect[] = []
	let useCheckFn: ((...args: any) => boolean)[] = []
	if (isArray(expect)) {
		expect.forEach((it, j) => {
			if (!typeExpect.includes(it)) {
				throwErr(`type.expect[${j}]`, typeExpect.toString(), i)
			}
			useCheckFn.push(checkTypeMap[it])
		})
		useExpect = expect
	} else {
		if (!typeExpect.includes(expect)) {
			throwErr('type.expect', typeExpect.toString(), i)
		}
		useExpect = [expect]
		useCheckFn = [checkTypeMap[expect]]
	}

	chekcHook(type, 'type', i)

	return {
		use: true,
		expect: useExpect,
		success,
		fail,
		checkFn: useCheckFn,
		transform,
		verify
	}
}

const parseLength = ({ length, field }: CheckFieldOptions, i: number): CheckLengthConf => {
	if (isUndefined(length)) {
		return {
			use: false,
			expect: {
				min: 0,
				max: Infinity
			},
			success: '',
			fail: '',
			transform: void 0,
			verify: void 0
		}
	}

	if (!isObject(length)) {
		throwErr('length', 'object', i)
	}

	let {
		expect,
		success = '',
		fail = `'${field}' length must >= ${expect.min} and <= ${expect.max}`,
		transform,
		verify
	} = length

	if (isUndefined(expect)) {
		expect = {
			min: 0,
			max: Infinity
		}
	} else {
		if (!isObject(expect)) {
			throwErr('length.expect', 'object', i)
		}

		expect = {
			max: expect.max,
			min: expect.min
		}

		if (!Number.isInteger(expect.min)) {
			throwErr('length.expect.min', 'integer', i)
		}

		if (!Number.isInteger(expect.max)) {
			throwErr('length.expect.max', 'integer', i)
		}
	}

	chekcHook(length, 'length', i)

	return {
		use: true,
		expect,
		success,
		fail,
		transform,
		verify
	}
}

const parseRange = ({ range, field }: CheckFieldOptions, i: number): CheckRangeConf => {
	if (isUndefined(range)) {
		return {
			use: false,
			expect: {
				min: -Infinity,
				max: Infinity
			},
			success: '',
			fail: '',
			transform: void 0,
			verify: void 0
		}
	}

	if (!isObject(range)) {
		throwErr('range', 'object', i)
	}

	let {
		expect,
		success = '',
		fail = `'${field}' range must >= ${expect.min} and <= ${expect.max}`,
		transform,
		verify
	} = range

	if (isUndefined(expect)) {
		expect = {
			min: -Infinity,
			max: Infinity
		}
	} else {
		if (!isObject(expect)) {
			throwErr('range.expect', 'object', i)
		}

		expect = {
			max: expect.max,
			min: expect.min
		}

		if (!isEffectiveNumber(expect.min)) {
			throwErr('range.expect.min', 'effective number', i)
		}

		if (!isEffectiveNumber(expect.max)) {
			throwErr('range.expect.max', 'effective number', i)
		}
	}

	chekcHook(range, 'range', i)

	return {
		use: true,
		expect,
		success,
		fail,
		transform,
		verify
	}
}

const parseCustoms = ({ customs }: CheckFieldOptions, i: number): CheckCustom[] => {
	if (isUndefined(customs)) {
		return []
	}

	if (!isArray(customs)) {
		throwErr('customs', 'array', i)
	}

	return customs.map((custom, j) => {
		if (!isFunction(custom)) {
			throwErr(`customs[${j}]`, 'function', i)
		}

		return custom
	})
}

const chekcHook = (options: CheckHookOptions, field: CheckConfFiledList[number], fromIndex: number) => {
	const { success = '', fail = '', transform, verify } = options
	if (!isString(success)) {
		throwErr(`${field}.success`, 'string', fromIndex)
	}

	if (!isString(fail)) {
		throwErr(`${field}.fail`, 'string', fromIndex)
	}

	if (!(isUndefined(transform) || isFunction(transform))) {
		throwErr(`${field}.transform`, 'function', fromIndex)
	}

	if (!(isUndefined(verify) || isFunction(verify))) {
		throwErr(`${field}.verify`, 'function', fromIndex)
	}
}
