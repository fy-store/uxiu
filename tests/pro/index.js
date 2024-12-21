console.clear()
import { crateApp } from '../../dist/index.js'

crateApp({
	mounted(ctx) {
		console.log(ctx.env)
	}
})
