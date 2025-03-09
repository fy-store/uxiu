import { readonly } from '@/utils/index.js'
import type { DeepReadonly } from '@/utils/readonly/types/index.js'
import { randomInt } from 'crypto'

/**
 * 生成一个安全随机数整数
 * - min <= n < max
 * - (max - min) 必须小于 2^48
 * - min 和 max 必须是 安全整数
 * - 该方法是基于 crypto.randomInt() 的
 * @param min 最小值(包含最小值)
 * @param max 最大值(取不到最大值)
 */
export const random = (min: number, max: number) => {
	return randomInt(min, max)
}

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

const num = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

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

const randomStr = (
	length: number,
	strList: string[] | Readonly<string[]> | DeepReadonly<string[]> = [...az, ...AZ]
) => {
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
 * 生成一个安全随机字符串
 * @param length 生成的字符串长度
 * @param strList 随机字符列表, 默认为 a-Z
 * - 通过 random.(az | AZ | num | sign | all) 获取常用的字符列表
 */
random.randomStr = randomStr
