import log4js from 'log4js'

export interface LoggerOptions<T extends Record<string, boolean> = Record<string, boolean>> {
	/** 日志存储目录路径 */
	storageDirPath: string
	/** 需要扩展的日志模块名称 */
	expandCategories?: T
	/** 进程崩溃自动记录, 默认为 true */
	collapseAutoRegister?: boolean
	/**
	 * log4js 配置项
	 * - 若为 pm2 运行程序, 请确保配置项中 pm2 为 true
	 * - 文档 https://log4js-node.github.io/log4js-node/clustering.html
	 */
	log4jsConfiguration?: log4js.Configuration
}

/**
 * 根据 expandCategories 生成的 Logger 扩展类型辅助
 */
export type LoggerExpanded<T extends Record<string, boolean>> = {
	[K in keyof T]: log4js.Logger
}
