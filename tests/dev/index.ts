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

	set(value?: 'a' | 'b') {
		return this.$query<boolean>()
	}
}

// 测试完整链式调用
async function testChain() {
	const result = await new Admin()
		.get()
		.$use<Admin['get']>(async function (that) {
			this.get()
			this.$result
			that.$result
			const res = await this.$run(this.set, 'a')
			res.$result
		})
		// .get()
		.$exec()
}

testChain().catch(console.error)
