const log = (() => {
	if (typeof console !== 'undefined') {
		return console
	} else {
		const err = new Error('Error: current data is read only ! console is not existence !')
		return {
			warn(..._data: any[]) {
				throw err
			},
			error(..._data: any[]) {
				throw err
			}
		}
	}
})()

export default {
	warn(...data: any[]) {
		log.warn('Warning: ', ...data)
	},

	error(...data: any[]) {
		log.error('Error: ', ...data)
		throw new Error('Error: current data is read only !')
	},

	none(..._data: any) {
		console.log('none')
	}
}
