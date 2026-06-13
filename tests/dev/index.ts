import { readonly } from '@/index.js'

const obj = readonly(
	{
		map: new Map([
			['a', { a: 1 }],
			['b', { b: 1 }]
		])
	},
	{ plugins: [readonly.plugins.collection] }
)

console.log('obj', obj)

const v = obj.map.values()
v.map((it) => {
	it.a = 100
}).toArray()
console.log('obj', obj)
