import { DbFit } from '../../dist/index.js'

class Admin extends DbFit {
	constructor() {
		super({
			async query(...args) {}
		})
	}

	get() {
		return this.$query<number>()
	}
}

new Admin()
	.get()
	.$use(function () {
		this.get()
	})
	.get()
