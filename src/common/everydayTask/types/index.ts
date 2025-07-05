export interface EverydayTaskTimedTasksOptions {
	/**
	 * 时, 0-59, 默认为 0
	 */
	hour?: number
	/**
	 * 分, 0-59, 默认为 0
	 */
	minute?: number
	/**
	 * 秒, 0-59, 默认为 0
	 */
	second?: number
	/**
	 * 毫秒, 0-999, 默认为 0
	 */
	millisecond?: number
	/**
	 * 如果设置的时间执行点已经过去, 是否立即触发一遍任务, 默认为 false
	 */
	exceedImmediatelyExecute?: boolean
}
