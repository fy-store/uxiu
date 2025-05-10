import { extract, readonly, EventBus } from '../../src/index.js'

const target = {
	a: 1,
	b: 2,
	c: 3,
	d: 4,
	e: 5,
	f: 6,
	g: 7,
	h: 8,
	i: 9,
	j: 10,
	k: 11,
	l: 12,
	m: 13,
	n: 14,
	o: 15
}

const result = readonly(extract(target, ['g', 'a']))

console.log('result', result)

class MyEventBus extends EventBus {}

const myEventBus = new MyEventBus({
	eventMap: {
		test: (ctx) => {
			console.log('test', ctx)
		}
	}
})

myEventBus.on('test')