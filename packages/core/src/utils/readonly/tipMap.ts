const log = (() => {
	if (typeof console !== 'undefined') {
		return console
	} else {
		return {
			warn(...data: any[]) {
				throw new Error(
					`'console.warn()' not existent, 'readonly()' prevent missing reminders, therefore throw Error ! ${String(
						data[0]
					)}`
				)
			},
			error(...data: any[]) {
				throw new Error(data[0])
			}
		}
	}
})()

export default {
	warn(...data: any[]) {
		data[0] = `\x1b[33m${String(data[0])} \x1B[0m`
		log.warn(...data)
	},

	error(...data: any[]) {
		data[0] = `\x1b[31m${String(data[0])} \x1B[0m`
		log.error(...data)
		throw new Error(data[0])
	},

	none(..._data: any) {}
}
