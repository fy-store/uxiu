import type { ReadonlyDeep } from '../../utils/readonly/types/index.js'
import { readonly } from '../../utils/readonly/index.js'

const RANDOM_BYTES_LENGTH = 6
const RANDOM_SOURCE_RANGE = 2 ** (RANDOM_BYTES_LENGTH * 8)

function random48BitInteger(): number {
	const bytes = globalThis.crypto.getRandomValues(new Uint8Array(RANDOM_BYTES_LENGTH))

	let result = 0
	for (const byte of bytes) {
		result = result * 256 + byte
	}
	return result
}

/**
 * 生成一个安全随机数整数
 * - min <= n < max
 * - (max - min) 必须小于 2^48
 * - min 和 max 必须是 安全整数
 * - 该方法基于 globalThis.crypto.getRandomValues(), 支持浏览器和 Node.js
 * @param min 最小值(包含最小值)
 * @param max 最大值(取不到最大值)
 */
export function random(min: number, max: number): number {
	if (!Number.isSafeInteger(min)) {
		throw new TypeError('min must be a safe integer')
	}
	if (!Number.isSafeInteger(max)) {
		throw new TypeError('max must be a safe integer')
	}

	const range = max - min
	if (range <= 0) {
		throw new RangeError('max must be greater than min')
	}
	if (range >= RANDOM_SOURCE_RANGE) {
		throw new RangeError('max - min must be less than 2^48')
	}

	const unbiasedLimit = RANDOM_SOURCE_RANGE - (RANDOM_SOURCE_RANGE % range)
	let value: number
	do {
		value = random48BitInteger()
	} while (value >= unbiasedLimit)

	return min + (value % range)
}

/** a-z 字符列表 */
const az = [
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z'
]

/** A-Z 字符列表 */
const AZ = [
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z'
]

/** 字符数字列表 */
const num = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** 符号列表 */
const sign = [
	'!',
	'@',
	'#',
	'$',
	'%',
	'^',
	'&',
	'*',
	'(',
	')',
	'-',
	'_',
	'+',
	'=',
	'[',
	']',
	'{',
	'}',
	'|',
	'\\',
	';',
	':',
	"'",
	'"',
	',',
	'.',
	'<',
	'>',
	'/',
	'?',
	'~',
	'`'
]

/** a-z, A-Z, 数字, 符号列表 */
const all = [...az, ...AZ, ...num, ...sign]

const SIGN = Symbol()

/** a-z 字符列表 */
random.az = readonly(az, { sign: SIGN })
/** A-Z 字符列表 */
random.AZ = readonly(AZ, { sign: SIGN })
/** 字符数字列表 */
random.num = readonly(num, { sign: SIGN })
/** 符号列表 */
random.sign = readonly(sign, { sign: SIGN })
/** a-z, A-Z, 数字, 符号列表 */
random.all = readonly(all, { sign: SIGN })

/**
 * 生成一个安全随机字符串
 * @param length 生成的字符串长度
 * @param strList 随机字符列表, 默认为 a-Z
 * - 通过 random.(az | AZ | num | sign | all) 获取常用的字符列表
 */
random.randomStr = function (
	length: number,
	strList: string[] | Readonly<string[]> | ReadonlyDeep<string[]> = [...az, ...AZ]
): string {
	// 保证生成超长字符串时的性能
	const list = (() => {
		try {
			if (readonly.isReadonly(strList)) {
				return readonly.toOrigin(strList, SIGN)
			}
			return strList
		} catch (error) {
			return strList
		}
	})()
	let result = ''
	let len = list.length
	for (let i = 0; i < length; i++) {
		result += list[random(0, len)]
	}
	return result
}

/**
 * 生成一个安全随机 a-z 字符串
 * @param length 生成的字符串长度
 * @returns a-z 字符串
 */
random.random26az = function (length: number): string {
	return random.randomStr(length, az)
}

/**
 * 生成一个安全随机 A-Z 字符串
 * @param length 生成的字符串长度
 * @returns A-Z 字符串
 */
random.random26AZ = function (length: number): string {
	return random.randomStr(length, AZ)
}

/**
 * 生成一个安全随机 0-9-a-z-A-Z 字符串
 * @param length 生成的字符串长度
 * @returns 0-9-a-z-A-Z 字符串
 */
random.random0toaZ = function (length: number): string {
	return random.randomStr(length, [...az, ...AZ, ...num])
}

/**
 * 生成一个安全随机 0-9-a-z 字符串
 * @param length 生成的字符串长度
 * @returns 0-9-a-z 字符串
 */
random.random0toaz = function (length: number): string {
	return random.randomStr(length, [...az, ...num])
}
