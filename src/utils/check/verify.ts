import type { CheckConfFiledList, CheckFieldConfs, FieldResult, CheckListItem, CheckListItemCustom } from './types/index.js'
import { isArray } from '../isArray/index.js'
import { isNumber } from '../isNumber/index.js'
import { isObject } from '../isObject/index.js'
import { isString } from '../isString/index.js'
import { isUndefined } from '../isUndefined/index.js'
import { readonly } from '../readonly/index.js'

/**
 * 根据字段配置校验数据
 * @param fieldConfs 字段配置
 * @param data 数据
 * @returns 校验结果
 */
export default (fieldConfs: CheckFieldConfs[], data: object) => {
	let result = true
	/** 成功字段列表 */
	const successList: CheckListItem[] = []
	/** 失败字段列表 */
	const failList: CheckListItem[] = []
	/** 校验字段列表 */
	const verifyList: CheckListItem[] = []

	// 根据字段配置校验数据对应的字段
	fieldConfs.forEach((conf, fieldIndex) => {
		const { field, required, requiredFail, customs } = conf

		const info: CheckListItem = {
			field,
			data: data[field],
			result: true,
			required,
			requiredFail: '',
			type: createFieldResult(),
			length: createFieldResult(),
			range: createFieldResult(),
			customResult: []
		}

		let isCheck = true

		// 字段必填时
		if (required) {
			// 数据对应字段不存在
			if (!(field in data)) {
				info.result = false
				info.requiredFail = requiredFail
				isCheck = false // 跳过后续校验
			}
		}
		// 字段非必填时
		else {
			// 数据中没有对应字段, 跳过校验(直接通过)
			if (!(field in data)) {
				isCheck = false
			}
		}

		if (isCheck) {
			// 根据字段对应配置进行校验
			confFiledList.forEach((field) => {
				const { use, transform, verify } = conf[field]
				if (transform) {
					info.data = transform(info.data, readonly(conf))
				}

				if (use) {
					if (verify) {
						const verifyResult = verify(
							info.data,
							() => {
								return confConditionMap[field](conf, info)
							},
							readonly({
								field,
								fieldIndex,
								conf,
								info
							})
						)

						if (isObject(verifyResult)) {
							if (!verifyResult.result) {
								setFail(conf, info, field)
							}

							if (!isUndefined(verifyResult.message)) {
								info[field].message = String(verifyResult.message)
							}
						} else if (!verifyResult) {
							setFail(conf, info, field)
						}
					} else if (!confConditionMap[field](conf, info)) {
						setFail(conf, info, field)
					}
				}
			})

			// 自定义校验
			customs.forEach((custom, customIndex) => {
				const customResult = custom(
					info.data,
					readonly({
						field,
						fieldIndex,
						conf,
						info,
						customIndex
					})
				)

				let itemResult: CheckListItemCustom = null
				if (isObject(customResult)) {
					itemResult = {
						name: isUndefined(customResult.message) ? '' : String(customResult.name),
						result: Boolean(customResult.result),
						message: isUndefined(customResult.message) ? '' : String(customResult.message)
					}
				} else {
					itemResult = {
						name: '',
						result: Boolean(customResult),
						message: ''
					}
				}

				info.customResult[customIndex] = itemResult
				if (!itemResult.result) {
					info.result = false
				}
			})
		}

		if (info.result) {
			successList.push(info)
		} else {
			result = false
			failList.push(info)
		}
		verifyList.push(info)
	})

	return {
		result,
		successList,
		failList,
		verifyList
	}
}

export const confFiledList: CheckConfFiledList = ['type', 'length', 'range']

const createFieldResult = (): FieldResult => {
	return {
		result: true,
		message: ''
	}
}

const setFail = (conf: CheckFieldConfs, info: CheckListItem, field: CheckConfFiledList[number]) => {
	info.result = false
	info[field].result = false
	info[field].message = conf[field].fail
}

/**
 * 是否通过校验映射表
 */
const confConditionMap: { [k in CheckConfFiledList[number]]: (conf: CheckFieldConfs, info: CheckListItem) => boolean } = {
	type(conf: CheckFieldConfs, info: CheckListItem) {
		const { type } = conf
		const { data } = info
		if (type.checkFn.length === 0) return true
		return type.checkFn.some((it) => it(data))
	},

	length(conf: CheckFieldConfs, info: CheckListItem) {
		const { length } = conf
		const { data } = info
		if (!(isArray(data) || isString(data))) {
			return false
		}
		return data.length >= length.expect.min && data.length <= length.expect.max
	},

	range(conf: CheckFieldConfs, info: CheckListItem) {
		const { range } = conf
		const { data } = info
		if (!isNumber(data)) {
			return false
		}
		return data >= range.expect.min && data <= range.expect.max
	}
}
