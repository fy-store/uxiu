import type { FieldsOptions, Options, Result } from './types/index.js'
import { isArray } from '../isArray/index.js'
import { isObject } from '../isObject/index.js'
import { isUndefined } from '../isUndefined/index.js'
import { readonly } from '../readonly/index.js'
import parseFieldsOptions from './parseFieldsOptions.js'
import verify, { confFiledList } from './verify.js'

/**
 * 创建一个检查器
 * @param fieldsOptions 字段配置
 * @param options 其他配置
 * @returns 检查器
 */
export const createCheck = <T = Record<string, string>>(fieldsOptions: FieldsOptions<T>, options?: Options) => {
	if (!isArray(fieldsOptions)) {
		throw new TypeError('"options.fieldsOptions" must be an array')
	}

	if (!(isUndefined(options) || isObject(options))) {
		throw new TypeError('"options" must be an object')
	}

	// 解析每一个字段配置, 生成字段配置对象
	const fieldConfs = parseFieldsOptions(fieldsOptions as any)

	/**
	 * 检查器
	 * @param data 需要检查的数据
	 * @returns 检查结果
	 */
	return (data: object): Result => {
		if (!isObject(data)) {
			throw new TypeError('"data" must be an object')
		}

		// 校验数据
		const { result, successList, failList, verifyList } = verify(fieldConfs, data)
		let _successMsgList = null
		let _successMsgMap = null
		let _failMsgList = null
		let _failMsgMap = null
		let _fieldConfs = null

		const resultInfo: Result = {
			result,
			success: {
				count: successList.length,
				get list() {
					return successList
				},
				get msgList() {
					if (_successMsgList) return _successMsgList
					const list = []
					successList.forEach((it) => {
						confFiledList.forEach((k) => {
							if (!it[k].result) {
								list.push(it[k].message)
							}
						})

						it.customResult.forEach((custom) => {
							list.push(custom.message)
						})
					})
					_successMsgList = list
					return list
				},
				get msgMap() {
					if (_successMsgMap) return _successMsgMap
					const collect = {}
					successList.forEach((it) => {
						confFiledList.forEach((k) => {
							if (!it[k].result) {
								if (!collect[it.field]) {
									collect[it.field] = []
								}
								collect[it.field].push(it[k].message)
							}
						})
						it.customResult.forEach((custom) => {
							if (!collect[it.field]) {
								collect[it.field] = []
							}
							collect[it.field].push(custom.message)
						})
					})
					_successMsgMap = collect
					return collect
				}
			},
			fail: {
				count: failList.length,
				get list() {
					return failList
				},
				get msgList() {
					if (_failMsgList) return _failMsgList
					const list = []
					failList.forEach((it) => {
						if (it.requiredFail) {
							list.push(it.requiredFail)
						}
						confFiledList.forEach((k) => {
							if (!it[k].result) {
								list.push(it[k].message)
							}
						})

						it.customResult.forEach((custom) => {
							list.push(custom.message)
						})
					})
					_failMsgList = list
					return list
				},
				get msgMap() {
					if (_failMsgMap) return _failMsgMap
					const collect = {}
					failList.forEach((it) => {
						if (it.requiredFail) {
							collect[it.field] = [it.requiredFail]
						}
						confFiledList.forEach((k) => {
							if (!it[k].result) {
								if (!collect[it.field]) {
									collect[it.field] = []
								}
								collect[it.field].push(it[k].message)
							}
						})
						it.customResult.forEach((custom) => {
							if (!collect[it.field]) {
								collect[it.field] = []
							}
							collect[it.field].push(custom.message)
						})
					})
					_failMsgMap = collect
					return collect
				}
			},
			get verifyList() {
				return verifyList
			},
			get fieldConfs() {
				if (_fieldConfs) return _fieldConfs
				_fieldConfs = readonly(fieldConfs)
				return _fieldConfs
			}
		}

		return resultInfo
	}
}
