import { crateApp, readonly } from '../../src/index.js'

crateApp({
	mounted(ctx) {
		const target = readonly({ a: 1 })
		console.log(target.a)
	}
})
