/**
 * 异步睡眠
 * - 若需要同步睡眠(阻塞线程)可调用 sleep.sync() 方法
 * @param time 睡眠时间, 单位毫秒
 * @param callback 睡眠结束回调
 * @returns 返回一个 Promise, 需自行等待来完成睡眠, Promise 结果为 callback 结果
 */
export const sleep = (time: number, callback?: (...args: any[]) => any) => {
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
sleep.sync = (time: number, callback?: (...args: any[]) => any) => {
	const start = Date.now()
	while (Date.now() - start < time) {}
	return callback?.()
}
