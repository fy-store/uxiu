import type { EverydayTaskTimedTasksOptions } from './types/index.js'
export * from './types/index.js'

/**
 * 每日定时任务
 * @param callback 到点回调, 回调内发生错误不会影响下一次执行, 回调接收一个 clearTimer() 方法, 调用该函数即可停止下一次任务
 * - 该方法是基于 setTimeout 实现的, 并且任务在执行时会插入微队列, 所以触发时机不是精准的
 * - 方法内部会对偏差在下一次任务进行自动调整(setTimeout 差值计算), 触发时机虽有偏差但不会过大
 * @param options 配置选项
 * @returns 一个函数, 调用该函数即可停止下一次任务
 */
export const everydayTask = (callback: (clearTimer: () => void) => void, options?: EverydayTaskTimedTasksOptions) => {
	let ctx = {
		isNext: true,
		timer: null as NodeJS.Timeout | number
	}

	const clearTimer = () => {
		ctx.isNext = false
		clearTimeout(ctx.timer)
	}

	const config = {
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0,
		...options
	}

	if (
		!Number.isInteger(config.hour) ||
		!Number.isInteger(config.minute) ||
		!Number.isInteger(config.second) ||
		!Number.isInteger(config.millisecond) ||
		config.hour < 0 ||
		config.hour > 23 ||
		config.minute < 0 ||
		config.minute > 59 ||
		config.second < 0 ||
		config.second > 59 ||
		config.millisecond < 0 ||
		config.millisecond > 999
	) {
		throw new Error(
			`Invalid time configuration: 'hour' must be between 0 and 23, 'minute' and 'second' between 0 and 59, 'millisecond' between 0 and 999`
		)
	}

	const func = (initial?: boolean) => {
		const now = new Date()
		const nowTime = now.getTime()
		const clear = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			config.hour,
			config.minute,
			config.second,
			config.millisecond
		)

		let clearTime = clear.getTime()

		// 如果设定的时间点已经过了今天的时间点，设定为明天的时间点
		if (clearTime <= nowTime) {
			if (initial && config.exceedImmediatelyExecute) {
				Promise.resolve().then(() => {
					try {
						callback(clearTimer)
					} catch (error) {
						console.error(error)
					}
				})
			}
			clear.setDate(clear.getDate() + 1)
			clearTime = clear.getTime()
		}

		clearTimeout(ctx.timer)
		ctx.timer = setTimeout(() => {
			Promise.resolve().then(() => {
				try {
					callback(clearTimer)
				} catch (error) {
					console.error(error)
				}
			})
			ctx.isNext && func()
		}, clearTime - nowTime)
	}

	func(true)
	return clearTimer
}
