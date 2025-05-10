import type { EventBus } from '../index.js'

/** 配置选项 */
export interface Options<S extends State, E extends EventMapOption<S, EventBus<S, E>>> {
	/** 状态对象 */
	state?: S
	/** 事件配置对象, key 为事件名, 支持 symbol */
	eventMap?: E
}

export type State = Record<string | symbol, any>

/** 上下文 */
export interface Ctx<S, Self> {
	/** 状态 */
	state: S
	/** 实例 */
	self: Self
}

/** 事件回调函数 */
export interface Callback<S, Self> {
	(ctx: Ctx<S, Self>, ...args: any[]): void
}

/** 事件回调函数配置选项 */
export interface CallbackOptions<S, Self> {
	/** 是否只执行一次 */
	once?: boolean
	/** 自定义标识 */
	sign?: symbol
	/** 事件回调 */
	fn: Callback<S, Self>
}

/** 事件配置对象, key 为事件名, 支持 symbol */
export interface EventMapOption<S, Self> {
	[k: string | symbol]: Callback<S, Self> | Callback<S, Self>[] | CallbackOptions<S, Self>[]
}

/** 注册事件配置选项 */
export interface OnOptions {
	/** 自定义标识 */
	sign?: symbol
}

export interface CallbackInfo<S, Self> {
	once: boolean
	sign: symbol
	fn: Callback<S, Self>
}

export interface EventMap<S, Self> {
	[k: string | symbol]: CallbackInfo<S, Self>[]
}

// 工具类型
type _DinfindEventMap<S extends State, Self, Keys extends string | symbol> = Partial<
	Record<Keys, Callback<S, Self> | Callback<S, Self>[] | CallbackOptions<S, Self>[]>
>

/** 自定义 eventMap */
export type DinfindEventMap<State, Keys extends string | symbol> = _DinfindEventMap<State, EventBus<State, any>, Keys>

// 工具类型
export type Self<S, E extends EventMapOption<S, EventBus<S, E>>> = EventBus<S, E>
