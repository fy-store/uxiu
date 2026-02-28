import type { DebounceOptions } from './types.js'
export * from './types.js'

/**
 * 防抖
 * @param fn 需要防抖的函数
 * @param delay 防抖的时间间隔，单位为毫秒
 * @param options 配置选项
 * @returns 返回一个防抖后的函数，该函数具有 `cancel` 方法用于取消等待中的执行，`flush` 方法用于立即执行等待中的调用
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number, options: DebounceOptions = {}) {
	let timer: ReturnType<typeof setTimeout> | null = null
	const { immediate = false } = options

	const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
		const callNow = immediate && !timer

		if (timer) {
			clearTimeout(timer)
			timer = null
		}

		timer = setTimeout(() => {
			timer = null
			if (!immediate) {
				fn.apply(this, args)
			}
		}, delay)

		if (callNow) {
			fn.apply(this, args)
		}
	}

	// 取消防抖（清除未执行任务）
	debounced.cancel = () => {
		if (timer) {
			clearTimeout(timer)
			timer = null
		}
	}

	// 立即执行一次（如果有等待中的调用）
	debounced.flush = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
		if (timer) {
			clearTimeout(timer)
			timer = null
			fn.apply(this, args)
		}
	}

	return debounced as typeof debounced & {
		cancel: () => void
		flush: (...args: Parameters<T>) => void
	}
}
