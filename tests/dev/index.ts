import { EventBus, type EventBusType } from '@/index.js'
import { DefindEventMap, EventMapOption } from '@/utils/eventBus/types/index.js'

// 定义具体的状态类型
type MyState = {
	count: number
	user: string
}

// 定义具体的事件映射配置
const sign = Symbol('myEventSign')
const another = Symbol('another')

interface MyEventMap extends EventMapOption<MyState, EventBus<MyState, MyEventMap>> {}

// 继承后定义具体类
class MyBus extends EventBus<MyState, DefindEventMap<MyState, 'a' | 'b'>> {
	customMethod() {
		this.emit('sayHi', '汪星人 🤤') // 自动提示参数 🐶😍
	}
}

const myBus = new MyBus({
	eventMap: {
		a() {}
	}
})
