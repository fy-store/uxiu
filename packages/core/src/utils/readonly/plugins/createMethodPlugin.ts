import type { CreateReadonlyMethodPluginOptions, ReadonlyPlugin } from '../types/index.js'

export function createReadonlyMethodPlugin<T extends object>(
	options: CreateReadonlyMethodPluginOptions<T>
): ReadonlyPlugin<T> {
	const methods = new Set(options.methods)

	return {
		name: options.name,
		match: options.match,
		get(event) {
			const value = event.get()
			if (typeof value !== 'function' || event.property === 'constructor') {
				return event.wrap(value)
			}

			if (methods.has(event.property)) {
				return (...args: any[]) => {
					event.prevent('call', event.property, args)
				}
			}

			return (...args: any[]) => {
				const result = Reflect.apply(value, event.target, args.map(event.unwrap))
				return event.wrap(result)
			}
		}
	}
}
