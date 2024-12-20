import { isEmpty } from '../isEmpty/index.js'

/**
 * 判断一个数组中或对象上是否存在空值(undefined 和 null)
 * - 不判断原型链上的属性
 * @param target 目标对象
 * @returns 结果
 */
export const hasEmpty = (target: object) => {
	return Array.isArray(target) ? target.some(isEmpty) : Object.values(target).some(isEmpty)
}
