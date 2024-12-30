import { isEffectiveNumber } from '../isEffectiveNumber/index.js'

/**
 * 判断一个数据是否为有效数字或数字字符串
 * - 有效数字和常规的数字字符串被认定为有效数字
 * - BigInt 类型 和 '' 和 NaN 和 Infinity 和 -Infinity 被视为无效数字
 * - 科学计数法, 进制表示法字符串被视为无效数字
 * - 字符串数字中不允许出现空白字符(空格, 制表, 换行 等)
 * - 不允许省略的形式的数字字符串, 例如: '.1' 和 '1.' 不被允许, 数字类型忽略该条规则, 因为数字在使用时会自动补全 0
 * - 字符串不允许以无效的多个 0 开头, 例如: 000001 , 数字类型无视该条规则, 因为数字在使用时会自动舍弃无效的 0
 * @param target 判断目标
 */
export const isEffectiveStrNumber = (target: number | string): boolean => {
	if (typeof target === 'number') {
		return isEffectiveNumber(target)
	}

	if (typeof target !== 'string') {
		return false
	}

	const reg = /^[(+|\-)?0-9]+(\.?)[0-9]*$/
	if (!reg.test(target)) {
		return false
	}

	const reg2 = /(^\.|00)|\.$/
	if (reg2.test(target)) {
		return false
	}

	return true
}
