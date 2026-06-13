import { createReadonly } from './createReadonly.js'
import type { ShallowReadonlyOptions } from './types/index.js'

export default function shallowReadonly<T extends object>(
	target: T,
	options: ShallowReadonlyOptions = {}
): Readonly<T> {
	return createReadonly(target, {
		...options,
		isShallowReadonly: true
	}) as Readonly<T>
}
