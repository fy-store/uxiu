const log = (() => {
	if (typeof console !== 'undefined') {
		return console
	} else {
		return {
			warn(...data: any[]) {
				throw new Error(data[0])
			},
			error(...data: any[]) {
				throw new Error(data[0])
			}
		}
	}
})()

export default {
	warn(...data: any[]) {
		log.warn(...data)
	},

	error(...data: any[]) {
		log.error(...data)
		throw new Error(data[0])
	},

	none(..._data: any) {}
}
