import type { ReadonlyDeep } from '@/utils/readonly/types/index.js'

export type CheckHookOptionsVerifyCtx = {
	/** 校验的字段 */
	field: string
	/** 校验字段在配置中的下标 */
	fieldIndex: number
	/** 字段配置列表 */
	conf: CheckFieldConfs
	/** 字段信息列表 */
	info: CheckListItem
}
export type CheckHookOptions = {
	/** 校验成功消息 */
	success?: string
	/** 校验失败消息 */
	fail?: string
	/** 钩子函数: 校验前处理函数 */
	transform?: (data: any, fieldConfs: CheckFieldConfs) => any
	/** 钩子函数: 自定义校验函数, 用于控制/拓展系统校验函数, 返回 true 则通过, 返回 false 则失败 */
	verify?: (
		/** 字段数据 */
		data: any,
		/** 系统校验函数, 调用该函数不会影响系统数据 */
		checkFn: () => boolean,
		/** 校验上下文 */
		ctx: CheckHookOptionsVerifyCtx
	) =>
		| boolean
		| {
				/** 校验结果 */
				result: boolean
				/** 校验结果消息 */
				message: string
		  }
}

export type CheckTypeOptions = CheckHookOptions & {
	/** 期待值 */
	expect: CheckTypeExpect | CheckTypeExpect[]
}

export type CheckLengthOptions = CheckHookOptions & {
	/** 期待值 */
	expect: {
		/** 最小值 */
		min: number
		/** 最大值 */
		max: number
	}
}

export type CheckRangeOptions = CheckHookOptions & {
	/** 期待值 */
	expect: {
		/** 最小值 */
		min: number
		/** 最大值 */
		max: number
	}
}
export type CheckCustomCtx = {
	/** 校验的字段 */
	field: string
	/** 校验字段在配置中的下标 */
	fieldIndex: number
	/** 字段配置列表 */
	conf: CheckFieldConfs
	/** 字段信息列表 */
	info: CheckListItem
	/** 自定义校验器在配置中的下标 */
	customIndex: number
}

export type CheckCustom = (
	/** 字段数据 */
	data: any,
	/** 校验上下文 */
	ctx: ReadonlyDeep<CheckCustomCtx>
) =>
	| boolean
	| {
			/** 自定义校验规则名称 */
			name?: string
			/** 校验结果 */
			result: boolean
			/** 校验结果消息 */
			message: string
	  }

export interface CheckFieldOptions<T = Record<string, string>> {
	/** 校验的字段 */
	field: keyof T
	/** 字段是否必填 */
	required?: boolean
	/** 字段必填失败时的消息 */
	requiredFail?: string
	/** 字段类型配置选项 */
	type?: CheckTypeOptions
	/** 字段长度配置选项 */
	length?: CheckLengthOptions
	/** 字段范围配置选项 */
	range?: CheckRangeOptions
	/** 自定义校验规则配置选项 */
	customs?: CheckCustom[]
}

export type CheckFieldsOptions<T> = CheckFieldOptions<T>[]

// 扩展选项
export interface CheckOptions {
	/**
	 * 校验前处理函数
	 * @param data 校验目标数据
	 */
	beforeCheck?: (data: Record<string | symbol, any>) => Record<string | symbol, any>
	/**
	 * 结果数据调用 getData() 前钩子函数
	 * @param result
	 * @returns
	 */
	beforeGetData?: (result: CheckResult) => any
}

export type CheckFiledConf = {
	/** 规则是否生效 */
	use: boolean
	/** 校验成功消息 */
	success: string
	/** 校验失败消息 */
	fail: string
	/** 钩子函数: 校验前处理函数 */
	transform?: (data: any, fieldOptions: ReadonlyDeep<CheckFieldOptions>) => any
	/** 钩子函数: 自定义校验函数, 用于控制/拓展系统校验函数, 返回 true 则通过, 返回 false 则失败 */
	verify?: (
		/** 字段数据 */
		data: any,
		/** 系统校验函数, 调用该函数不会影响系统数据 */
		checkFn: () => boolean,
		/** 校验上下文 */
		ctx: ReadonlyDeep<CheckHookOptionsVerifyCtx>
	) =>
		| boolean
		| {
				/** 校验结果 */
				result: boolean
				/** 校验结果消息 */
				message: string
		  }
}
export type CheckFieldConf = string

export type CheckRequiredConf = boolean

export type CheckTypeExpect =
	| 'any'
	| 'number'
	| 'effectiveNumber'
	| 'effectiveStrNumber'
	| 'effectiveStrInt'
	| 'effectiveStrPositiveInt'
	| 'string'
	| 'boolean'
	| 'null'
	| 'undefined'
	| 'array'
	| 'object'
	| 'symbol'
	| 'bigint'
	| 'function'

export type CheckVerifyTypeMap = {
	[k in CheckTypeExpect]: (...args: any) => boolean
}

export type CheckTypeConf = CheckFiledConf & {
	/** 期待值 */
	expect: CheckTypeExpect[]
	/** 校验函数列表 */
	checkFn: ((...args: any) => boolean)[]
}

export type CheckLengthConf = CheckFiledConf & {
	/** 期待值 */
	expect: {
		/** 最小值 */
		min: number
		/** 最大值 */
		max: number
	}
}

export type CheckRangeConf = CheckFiledConf & {
	/** 期待值 */
	expect: {
		/** 最小值 */
		min: number
		/** 最大值 */
		max: number
	}
}

export type CheckFieldConfs = {
	/** 字段配置 */
	field: CheckFieldConf
	/** 字段是否必填 */
	required: CheckRequiredConf
	/** 字段必填失败时的消息 */
	requiredFail: string
	/** 字段类型配置 */
	type: CheckTypeConf
	/** 字段长度配置 */
	length: CheckLengthConf
	/** 字段范围配置 */
	range: CheckRangeConf
	/** 自定义校验规则配置 */
	customs: CheckCustom[]
}

export type CheckConfFiledList = ['type', 'length', 'range']

export type FieldResult = {
	/** 校验结果 */
	result: boolean
	/** 结果消息 */
	message: string
}

export type CheckListItemCustom = FieldResult & {
	/** 自定义校验规则名称 */
	name: string
}

export type CheckListItem = {
	/** 字段对应的数据 */
	data: any
	/** 字段校验结果 */
	result: boolean
	/** 校验的字段 */
	field: CheckFieldConf
	/** 字段是否必填 */
	required: boolean
	/** 字段必填失败时的消息 */
	requiredFail: string
	/** 字段类型校验结果信息 */
	type: FieldResult
	/** 字段长度校验结果信息 */
	length: FieldResult
	/** 字段范围校验结果信息 */
	range: FieldResult
	/** 自定义校验结果信息 */
	customResult: CheckListItemCustom[]
}

export type CheckMessageMap = {
	[k: string]: string[]
}

export interface CheckResult {
	/**
	 * 获取校验后的数据
	 * - 该数据会经 options.beforeGetData() 处理
	 * - @param handle 前置处理函数
	 */
	getData: <T = any>(handle?: (info: CheckResult) => any) => T
	/** 校验结果 */
	result: boolean
	/** 成功的校验字段信息 */
	success: {
		/** 成功的字段数 */
		count: number
		/** 成功字段信息列表 */
		list: CheckListItem[]
		/** 成功字段消息集合 */
		msgMap: CheckMessageMap
		/** 成功字段消息列表 */
		msgList: string[]
	}
	/** 失败的校验字段信息 */
	fail: {
		/** 失败的字段数 */
		count: number
		/** 失败字段信息列表 */
		list: CheckListItem[]
		/** 失败字段消息集合 */
		msgMap: CheckMessageMap
		/** 失败字段消息列表 */
		msgList: string[]
	}
	/** 所有校验的字段信息 */
	verifyList: CheckListItem[]
	/** 解析后的字段配置 */
	fieldConfs: ReadonlyDeep<CheckFieldConfs[]>
}
