import { readonly, createApp } from '@/index.js'

const app = await createApp({
	port: 3323,
	mounted(ctx) {
		// console.log(ctx)
	},
})
console.log(app)
