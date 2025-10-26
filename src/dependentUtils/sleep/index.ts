/**
 * 异步睡眠
 * - 若需要同步睡眠(阻塞线程)可调用 sleep.sync() 方法
 * @param time 睡眠时间, 单位毫秒
 * @param callback 睡眠结束回调
 * @returns 返回一个 Promise, 需自行等待来完成睡眠, Promise 结果为 callback 结果
 */
export function sleep<T extends (...args: any[]) => any = (...args: any[]) => any>(
	time: number,
	callback?: T
): Promise<ReturnType<T> | undefined> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(callback?.())
		}, time)
	})
}

/**
 * 同步睡眠(阻塞线程)
 * @param time 睡眠时间, 单位毫秒
 * @param callback 睡眠结束回调
 * @returns callback 结果
 */
sleep.sync = function <T extends (...args: any[]) => any = (...args: any[]) => any>(
	time: number,
	callback?: T
): ReturnType<T> | undefined {
	const start = Date.now()
	while (Date.now() - start < time) {}
	return callback?.()
}
