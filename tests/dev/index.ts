// import { DbFit } from '../../dist/index.js'
import { DbFit } from '@/index.js'

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
	const result = await new Admin()
		.get()
		.$use<Admin['get']>(function (that) {
			this.get()
			this.$result
			that.$result
			// this.$use(new Admin())
		})
		// .get()
		.$exec()
}

testChain().catch(console.error)
