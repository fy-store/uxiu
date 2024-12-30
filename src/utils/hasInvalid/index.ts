/**
 * hasInvalid() 配置选项
 */
interface VerifyConfig {
	/** undefined 默认为 true */
	undefined?: boolean
	/** null 默认为 true */
	null?: boolean
	/** NaN 默认为 true */
	NaN?: boolean
	/** Infinity 默认为 true */
	Infinity?: boolean
	/** -Infinity 默认为 true */
	'-Infinity'?: boolean
	/** '' 默认为 false */
	''?: boolean
	/** 0 默认为 false */
	'0'?: boolean
	/** -0 默认为 false */
	'-0'?: boolean
	/** false 默认为 false */
	false?: boolean
	[key: string]: boolean
}

/**
 * 判断一个数组中或对象上是否存在无效值
 * - 默认情况下被视为无效值的有 undefined 和 null 和 NaN 和 Infinity 和 -Infinity
 * - 可以通过传入第三个参数, 通过配置对象来指定哪些值是无效的
 * - 需要注意的是 0 和 -0 不是一个值, 如果你需要把 0 作为无效值, 那么你应该将 0 和 -0 都标记为 true, 示例: {0: true, '-0': true}
 * - 不判断原型链上的属性
 * @param target 目标对象
 * @param ignoreField 忽略的字段集合
 * @param verifyConfig 验证配置
 * @returns 结果
 */
export const hasInvalid = <T extends object>(target: T, ignoreField?: (keyof T)[], verifyConfig?: VerifyConfig) => {
	const config = Object.assign(
		{
			undefined: true,
			null: true,
			NaN: true,
			Infinity: true,
			'-Infinity': true
			// '': false,
			// '0': false,
			// '-0': false,
			// false: false
		},
		verifyConfig ?? {}
	)

	const ignoreFieldConfig = ignoreField ?? []

	const handle = (item: any) => {
		if (Object.is(item, -0)) {
			return config['-0']
		}

		if (Object.is(item, 0)) {
			return config['0']
		}

		return config[item]
	}

	return Array.isArray(target)
		? target.some((it, i) => {
				if (ignoreFieldConfig.includes(String(i) as keyof T)) return false
				return handle(it)
		  })
		: Object.entries(target).some(([key, it]) => {
				if (ignoreFieldConfig.includes(String(key) as keyof T)) return false
				return handle(it)
		  })
}
