import { isEmpty } from '../isEmpty/index.js'
import { isReferenceValue } from '../isReferenceValue/index.js'

/**
 * 判断一个数组中或对象上是否存在空值(undefined 和 null)
 * - 非引用类型将抛出异常
 * - 函数将当作对象处理
 * - 不判断原型链上的属性
 * - 仅判断可枚举的属性
 * @param target 目标对象
 * @returns 结果
 */
export function hasEmpty(target: object): boolean {
	if (!isReferenceValue(target)) {
		throw new TypeError('target must be an object or array')
	}
	return Array.isArray(target) ? target.some(isEmpty) : Object.values(target).some(isEmpty)
}
