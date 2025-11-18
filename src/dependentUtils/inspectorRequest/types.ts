export type InspectorMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT'

export interface InspectorConf<T> {
	/** 方法 */
	methods: InspectorMethod | InspectorMethod[] | '*' | null
	/** 路径配置, 仅允许出现 a-zA-Z0-9_-* 其中 `*` 表示任意字符 */
	path: string | null
	/** 元数据 */
	meta?: T
}

export interface InspectorOptions {
	/** 基础路径, 默认 `/` */
	base?: string
	/** 大小写敏感, 默认 `true` */
	sensitive?: boolean
	/** 是否允许末尾跟随分隔符, 默认 `false` */
	trailing?: boolean
}

export interface InspectorRule<T> {
	/** 方法列表 */
	methods: InspectorMethod[] | null
	/** 路径 */
	path: string | null
	/** 路径正则表达式 */
	regex: RegExp | null
	/** 元数据 */
	meta?: T
}

export interface InspectorRuleConf<T> {
	/** 方法列表 */
	methods: InspectorMethod[] | null
	/** 路径 */
	path: string | null
	/** 元数据 */
	meta?: T
}
export interface InspectorRuleSerialize<T> {
	/** 方法列表 */
	methods: InspectorMethod[] | null
	/** 路径 */
	path: string | null
	/** 正则表达式序列化信息 */
	regex: {
		source: string
		flags: string
	} | null
	/** 元数据 */
	meta?: T
}
