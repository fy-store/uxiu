import { readonly } from '@/index.js'

const origin = {
	a: 1,
	increment() {
		this.a++
	}
}

const target = readonly.shallowReadonly(origin, { proxyFunction: false })

target.increment()
console.log(origin)
