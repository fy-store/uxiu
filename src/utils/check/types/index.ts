export type HookOptionsVerifyCtx = {
	/** 校验的字段 */
	field: string
	/** 校验字段在配置中的下标 */
	fieldIndex: number
	/** 字段配置列表 */
	conf: FieldConfs
	/** 字段信息列表 */
	info: ListItem
}
export type HookOptions = {
	/** 校验成功消息 */
	success?: string
	/** 校验失败消息 */
	fail?: string
	/** 钩子函数: 校验前处理函数 */
	transform?: (data: any, fieldConfs: FieldConfs) => any
	/** 钩子函数: 自定义校验函数, 用于控制/拓展系统校验函数, 返回 true 则通过, 返回 false 则失败 */
	verify?: (
		/** 字段数据 */
		data: any,
		/** 系统校验函数, 调用该函数不会影响系统数据 */
		checkFn: () => boolean,
		/** 校验上下文 */
		ctx: HookOptionsVerifyCtx
	) =>
		| boolean
		| {
				/** 校验结果 */
				result: boolean
				/** 校验结果消息 */
				message: string
		  }
}

export type TypeOptions = HookOptions & {
	/** 期待值 */
	expect: TypeExpect | TypeExpect[]
}

export type LengthOptions = HookOptions & {
	/** 期待值 */
	expect: {
		/** 最小值 */
		min: number
		/** 最大值 */
		max: number
	}
}

export type RangeOptions = HookOptions & {
	/** 期待值 */
	expect: {
		/** 最小值 */
		min: number
		/** 最大值 */
		max: number
	}
}
export type CustomCtx = {
	/** 校验的字段 */
	field: string
	/** 校验字段在配置中的下标 */
	fieldIndex: number
	/** 字段配置列表 */
	conf: FieldConfs
	/** 字段信息列表 */
	info: ListItem
	/** 自定义校验器在配置中的下标 */
	customIndex: number
}

export type Custom = (
	/** 字段数据 */
	data: any,
	/** 校验上下文 */
	ctx: Readonly<CustomCtx>
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

export interface FieldOptions<T = Record<string, string>> {
	/** 校验的字段 */
	field: keyof T
	/** 字段是否必填 */
	required?: boolean
	/** 字段必填失败时的消息 */
	requiredFail?: string
	/** 字段类型配置选项 */
	type?: TypeOptions
	/** 字段长度配置选项 */
	length?: LengthOptions
	/** 字段范围配置选项 */
	range?: RangeOptions
	/** 自定义校验规则配置选项 */
	customs?: Custom[]
}

export type FieldsOptions<T> = FieldOptions<T>[]

// 扩展选项, 待补充
export interface Options {}

export type FiledConf = {
	/** 规则是否生效 */
	use: boolean
	/** 校验成功消息 */
	success: string
	/** 校验失败消息 */
	fail: string
	/** 钩子函数: 校验前处理函数 */
	transform?: (data: any, fieldOptions: FieldOptions) => any
	/** 钩子函数: 自定义校验函数, 用于控制/拓展系统校验函数, 返回 true 则通过, 返回 false 则失败 */
	verify?: (
		/** 字段数据 */
		data: any,
		/** 系统校验函数, 调用该函数不会影响系统数据 */
		checkFn: () => boolean,
		/** 校验上下文 */
		ctx: HookOptionsVerifyCtx
	) =>
		| boolean
		| {
				/** 校验结果 */
				result: boolean
				/** 校验结果消息 */
				message: string
		  }
}
export type FieldConf = string

export type RequiredConf = boolean

export type TypeExpect =
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

export type CheckTypeMap = {
	[k in TypeExpect]: (...args: any) => boolean
}

export type TypeConf = FiledConf & {
	/** 期待值 */
	expect: TypeExpect[]
	/** 校验函数列表 */
	checkFn: ((...args: any) => boolean)[]
}

export type LengthConf = FiledConf & {
	/** 期待值 */
	expect: {
		/** 最小值 */
		min: number
		/** 最大值 */
		max: number
	}
}

export type RangeConf = FiledConf & {
	/** 期待值 */
	expect: {
		/** 最小值 */
		min: number
		/** 最大值 */
		max: number
	}
}

export type FieldConfs = {
	/** 字段配置 */
	field: FieldConf
	/** 字段是否必填 */
	required: RequiredConf
	/** 字段必填失败时的消息 */
	requiredFail: string
	/** 字段类型配置 */
	type: TypeConf
	/** 字段长度配置 */
	length: LengthConf
	/** 字段范围配置 */
	range: RangeConf
	/** 自定义校验规则配置 */
	customs: Custom[]
}

export type ConfFiledList = ['type', 'length', 'range']

export type FieldResult = {
	/** 校验结果 */
	result: boolean
	/** 结果消息 */
	message: string
}

export type ListItemCustom = FieldResult & {
	/** 自定义校验规则名称 */
	name: string
}

export type ListItem = {
	/** 字段对应的数据 */
	data: any
	/** 字段校验结果 */
	result: boolean
	/** 校验的字段 */
	field: FieldConf
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
	customResult: ListItemCustom[]
}

export type MessageMap = {
	[k: string]: string[]
}

export interface Result {
	/** 校验结果 */
	result: boolean
	/** 成功的校验字段信息 */
	success: {
		/** 成功的字段数 */
		count: number
		/** 成功字段信息列表 */
		list: ListItem[]
		/** 成功字段消息集合 */
		msgMap: MessageMap
		/** 成功字段消息列表 */
		msgList: string[]
	}
	/** 失败的校验字段信息 */
	fail: {
		/** 失败的字段数 */
		count: number
		/** 失败字段信息列表 */
		list: ListItem[]
		/** 失败字段消息集合 */
		msgMap: MessageMap
		/** 失败字段消息列表 */
		msgList: string[]
	}
	/** 所有校验的字段信息 */
	verifyList: ListItem[]
	/** 解析后的字段配置 */
	fieldConfs: readonly FieldConfs[]
}
