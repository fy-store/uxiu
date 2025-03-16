import { createCheck, extract } from '../index.js'

type Conf = {
	name: string
	age: number
	sex: string
}

const data = {
	name: 1,
	age: 21,
	sex: '男'
}

const check = createCheck<Conf>([
	{
		field: 'name',
		required: false,
		type: {
			expect: ['string', 'number']
		},

		range: {
			expect: {
				min: 0,
				max: 100
			}
		}
	}
])

// console.log(check(data))
