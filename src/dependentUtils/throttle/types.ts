export interface ThrottleOptions {
	/** 首次调用是否立即触发, 默认为 true */
	immediately?: boolean
	/** 
     * 是否结束时尾调用, 默认为 false
     * - 当为 true 时, 在抑制期间内的最后一次调用会在抑制结束时触发
     */
	trailing?: boolean
}
