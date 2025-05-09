import type { EventBus } from '../index.js'

export interface Options<S extends State, E extends Events<S, EventBus<S, E>>> {
	state?: S
	events?: E
}

export type State = Record<string | symbol, any>

export interface Ctx<S, SE> {
	state: S
	self: SE
}

export interface Callback<S, SE> {
	(ctx: Ctx<S, SE>, ...args: any[]): void
}

export interface CallbackOptions<S, SE> {
	once?: boolean
	sign?: symbol
	fn: Callback<S, SE>
}

export interface Events<S, SE> {
	[k: string | symbol]: Callback<S, SE> | Callback<S, SE>[] | CallbackOptions<S, SE>[]
}

export interface OnOptions {
	msg?: string
}

export interface EventStore<S, SE> {
	once: boolean
    sign: symbol
	name?: string
	fn: Callback<S, SE>
}
