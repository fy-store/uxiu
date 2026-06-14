import type { ThrottleOptions } from './types.js'
export * from './types.js'

/**
 * 节流
 * @param fn 需要节流的函数
 * @param delay 节流的时间间隔，单位为毫秒
 * @param options 配置选项
 * @returns 返回一个节流后的函数，该函数具有一个 `cancel` 方法用于取消下一次未来的执行
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number, options: ThrottleOptions = {}) {
	let lastTime = 0
	let timer: ReturnType<typeof setTimeout> | null = null
	const { immediately = true, trailing = false } = options

	const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
		const now = Date.now()

		if (!lastTime && !immediately) {
			lastTime = now
		}

		const remaining = delay - (now - lastTime)

		if (remaining <= 0) {
			if (timer) {
				clearTimeout(timer)
				timer = null
			}
			lastTime = now
			fn.apply(this, args)
		} else if (trailing && !timer) {
			timer = setTimeout(() => {
				lastTime = immediately ? Date.now() : 0
				timer = null
				fn.apply(this, args)
			}, remaining)
		}
	}

	// 取消：清除尾执行并重置节流状态
	throttled.cancel = () => {
		if (timer) {
			clearTimeout(timer)
			timer = null
		}
		lastTime = 0
	}

	return throttled as typeof throttled & {
		cancel: () => void
	}
}
