import { createApp, readonly } from '../../src/index.js'

createApp({
	mounted(ctx) {
		const target = readonly({ a: 1 })
		console.log(target.a)
	}
})
