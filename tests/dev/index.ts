import { createDbFit } from '@/index.js'

const DbFit = createDbFit({
	async query(sql: string, params: any[]) {
		// console.log(sql, params)
		return [[], { sql, params }]
	}
})

class Admin extends DbFit {
	constructor() {
		super()
	}

	get(id: number) {
		return this.$query('SELECT * FROM admin WHERE id = ?', [id])
	}

	create(name: string, password: string) {
		return this.$query('INSERT INTO admin (name, password) VALUES (?, ?)', [name, password])
	}
}

const admin = new Admin()
const result = await admin
	.get(1)
	.$use((self) => {
		if (self.$result) {
			self.$end()
		}
		return self
	})
	.create('root', '123456')
	.$exec()
