import { readonly } from '../index.js'
console.clear()

const obj = {
	info: {
		name: 'lala',
		changeName(name: string) {
			obj.info.name = name
		}
	}
}

const newObj = readonly(obj)
// newObj.info.name = 'abc'
// console.log(newObj)
const newObj2 = readonly.shallowReadonly(newObj)
newObj2.info.name = 'lala3'
// console.log()
// newObj.info.name = 'lala2'
// newObj.info.changeName('lala2')
// console.log(newObj)
// readonly.toOrigin(newObj).info.name = 'lala3'
// console.log(readonly.toOrigin(newObj))
