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
	const result = await new Admin()
		.get()
		.$use(function () {
			this.get()
			this.$use(new Admin())
		})
		.get()
		.$exec()

	console.log('Chain result:', result)
	console.log('Chain result type:', typeof result)

	const num: number = result
	console.log('Chain type assertion successful:', num)

	return result
}

testChain().catch(console.error)
