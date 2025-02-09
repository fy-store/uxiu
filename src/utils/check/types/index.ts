export type HookOptionsVerifyCtx = {
	field: string
	fieldIndex: number
	conf: FieldConfs
	info: ListItem
}
export type HookOptions = {
	success?: string
	fail?: string
	transform?: (data: any, fieldConfs: FieldConfs) => any
	verify?: (
		data: any,
		checkFn: () => boolean,
		ctx: HookOptionsVerifyCtx
	) => boolean | { result: boolean; message: string }
}

export type TypeOptions = HookOptions & {
	expect: TypeExpect
}

export type LengthOptions = HookOptions & {
	expect: {
		min: number
		max: number
	}
}

export type RangeOptions = HookOptions & {
	expect: {
		min: number
		max: number
	}
}
export type CustomCtx = {
	field: string
	fieldIndex: number
	conf: FieldConfs
	info: ListItem
	customIndex: number
}

export type Custom = (data: any, ctx: Readonly<CustomCtx>) => boolean | { result: boolean; message: string }

export interface FieldOptions<T = Record<string, string>> {
	field: keyof T
	required?: boolean
	requiredFail?: string
	type?: TypeOptions
	length?: LengthOptions
	range?: RangeOptions
	customs?: Custom[]
}

export type FieldsOptions<T> = FieldOptions<T>[]

// 扩展选项, 待补充
export interface Options {}

export type FiledConf = {
	use: boolean
	success: string
	fail: string
	transform?: (data: any, fieldOptions: FieldOptions) => any
	verify?: (
		data: any,
		checkFn: () => boolean,
		ctx: HookOptionsVerifyCtx
	) => boolean | { result: boolean; message: string }
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

export type CheckTypeMap = {
	[k in TypeExpect]: (...args: any) => boolean
}

export type TypeConf = FiledConf & {
	expect: TypeExpect
	checkFn: (...args: any) => boolean
}

export type LengthConf = FiledConf & {
	expect: {
		min: number
		max: number
	}
}

export type RangeConf = FiledConf & {
	expect: {
		min: number
		max: number
	}
}

export type FieldConfs = {
	field: FieldConf
	required: RequiredConf
	requiredFail: string
	type: TypeConf
	length: LengthConf
	range: RangeConf
	customs: Custom[]
}

export type ConfFiledList = ['type', 'length', 'range']

export type FieldResult = {
	result: boolean
	message: string
}

export type ListItemCustom = FieldResult

export type ListItem = {
	data: any
	result: boolean
	field: FieldConf
	required: boolean
	requiredFail: string
	type: FieldResult
	length: FieldResult
	range: FieldResult
	customResult: ListItemCustom[]
}

export type MessageMap = {
	[k: string]: string[]
}

export interface Result {
	result: boolean
	success: {
		count: number
		list: ListItem[]
		msgMap: MessageMap
		msgList: string[]
	}
	fail: {
		count: number
		list: ListItem[]
		msgMap: MessageMap
		msgList: string[]
	}
	verifyList: ListItem[]
	fieldConfs: readonly FieldConfs[]
}
