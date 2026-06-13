import { createReadonly } from './createReadonly.js'
import shallowReadonly from './createShallowReadonly.js'
import {
	getTip,
	isDeepReadonly,
	isReadonly,
	isShallowReadonly,
	toOrigin
} from './context.js'
import { readonlyPlugins } from './plugins/index.js'
import type { ReadonlyDeep, ReadonlyOptions } from './types/index.js'

export * from './types/index.js'
export * from './plugins/index.js'

/**
 * 将普通对象、数组以及插件支持的类型包装为深层只读引用。
 * 默认只代理普通对象和数组，其他类型需要通过 plugins 配置启用。
 */
export function readonly<T extends object>(target: T, options: ReadonlyOptions = {}): ReadonlyDeep<T> {
	return createReadonly(target, {
		...options,
		isShallowReadonly: false
	})
}

readonly.shallowReadonly = shallowReadonly
readonly.isDeepReadonly = isDeepReadonly
readonly.isShallowReadonly = isShallowReadonly
readonly.isReadonly = isReadonly
readonly.toOrigin = toOrigin
readonly.getTip = getTip
readonly.plugins = readonlyPlugins
