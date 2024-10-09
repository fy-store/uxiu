const log = (() => {
	if (typeof console !== 'undefined') {
		return console
	} else {
		return {
			warn(..._data: any[]) {},
			error(..._data: any[]) {}
		}
	}
})()

export default {
	warn(data: any) {
		log.warn('Warning: ', data, 'is read only !')
	},

	error(data: any) {
		log.error('Error: ', data, 'is read only !')
		throw new Error('Error: current data is read only !')
	},

	none(_data: any) {}
}
