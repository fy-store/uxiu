export type Options = {
	/** 代理唯一标识, 在调用 readOnly.toOrigin() 时校验可用 */
	sign?: any
	/** 错误提示等级 */
	tip?: 'none' | 'warn' | 'error'
}
