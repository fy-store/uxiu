# 只读代理

`readonly` 使用 Proxy 创建运行时只读引用。普通对象和数组无需插件，Date、集合、二进制视图和类实例需要插件支持。

## 深层只读

```ts
import { readonly } from 'uxiu/utils'

const origin = {
	name: 'uxiu',
	nested: { count: 1 },
	list: [{ id: 1 }]
}

const state = readonly(origin, { tip: 'error' })

state.nested.count = 2 // TypeScript 报错，运行时也会阻止
```

支持循环引用和重复引用，重复读取同一对象会得到相同代理。

## 配置

```ts
interface ReadonlyOptions {
	sign?: unknown
	tip?: 'none' | 'warn' | 'error'
	plugins?: readonly ReadonlyPlugin[]
}
```

| 配置 | 说明 |
| --- | --- |
| `sign` | 调用 `readonly.toOrigin()` 时使用的校验标识 |
| `tip` | 修改被阻止时静默、警告或抛错 |
| `plugins` | 按顺序匹配，第一个匹配插件生效 |

## 辅助方法

```ts
const sign = Symbol('state')
const target = readonly(origin, { sign, tip: 'warn' })

readonly.isReadonly(target) // true
readonly.isDeepReadonly(target) // true
readonly.isShallowReadonly(target) // false
readonly.getTip(target) // 'warn'
readonly.toOrigin(target, sign) === origin // true
```

`readonly.toOrigin()` 只接受只读代理。配置自定义 `sign` 后必须传入相同标识。

## 浅层只读

```ts
const target = readonly.shallowReadonly(
	{ top: 1, nested: { count: 1 } },
	{ tip: 'none' }
)

target.top = 2 // 被阻止
target.nested.count = 2 // 允许
```

## 内置插件

```ts
const state = readonly(
	{
		date: new Date(),
		cache: new Map([['user', { name: 'admin' }]]),
		bytes: new Uint8Array([1, 2, 3])
	},
	{
		plugins: [
			readonly.plugins.date,
			readonly.plugins.collection,
			...readonly.plugins.binary
		]
	}
)
```

| 插件 | 保护内容 |
| --- | --- |
| `date` | 阻止 Date 的 `set*` 方法 |
| `collection` | Map、Set、WeakMap、WeakSet 的修改方法和深层查询结果 |
| `arrayBuffer` | ArrayBuffer / SharedArrayBuffer 修改方法 |
| `dataView` | DataView 的 `set*` 方法 |
| `typedArray` | TypedArray 和 Node Buffer 的原地修改方法 |
| `binary` | 上述三个二进制插件数组 |

内置插件既可以通过 `readonly.plugins` 获取，也可以直接导入：

```ts
import {
	arrayBufferReadonlyPlugin,
	binaryReadonlyPlugins,
	collectionReadonlyPlugin,
	dataViewReadonlyPlugin,
	dateReadonlyPlugin,
	readonlyPlugins,
	typedArrayReadonlyPlugin
} from 'uxiu/utils'
```

`readonlyPlugins` 与 `readonly.plugins` 指向相同的具名插件集合。

## 自定义类插件

```ts
import { createReadonlyMethodPlugin, readonly } from 'uxiu/utils'

class Counter {
	count = 0
	increment() {
		this.count++
	}
}

const counterPlugin = createReadonlyMethodPlugin<Counter>({
	name: 'counter',
	match: (target): target is Counter => target instanceof Counter,
	methods: ['increment']
})

const counter = readonly(new Counter(), {
	plugins: [counterPlugin]
})
```

复杂场景可以实现 `ReadonlyPlugin` 的 `get`、`set`、`deleteProperty`、`defineProperty`、`apply` 和 `construct` 钩子。
