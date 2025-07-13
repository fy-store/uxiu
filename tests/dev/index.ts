import { DbFit } from '../../dist/index.js'
// import { DbFit } from '@/index.js'

class Admin extends DbFit {
	constructor() {
		super({
			async query(...args) {
				return 1
			}
		})
	}

	get() {
		return this.$query<number>()
	}
}

// 测试完整链式调用
async function testChain() {
	const a = new Admin().get()
	a.$use<typeof a>(function () {
		this.$result
	})

	const result = await new Admin()
		.get()
		.$use<ReturnType<Admin['get']>>(function (that) {
			this.get()
			this.$result
			that.$result
			// this.$use(new Admin())
		})
		// .get()
		.$exec()
}

testChain().catch(console.error)
