export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT'

export interface Conf {
    /** 方法 */
	methods: Method | Method[] | '*'
    /** 路径配置, 仅允许出现 a-zA-Z0-9_-* 其中 `*` 表示任意字符 */
	path: string
}

export interface Options {
    /** 基础路径, 默认 `/` */
	base?: string
	/** 大小写敏感, 默认 `true` */
	sensitive?: boolean
	/** 是否允许末尾跟随分隔符, 默认 `false` */
	trailing?: boolean
}

export interface Rule {
    /** 方法列表 */
	methods: Method[]
    /** 路径 */
	path: string
    /** 路径正则表达式 */
	regex: RegExp
}
