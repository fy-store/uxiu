# 对象与校验工具

## `extract`

从对象提取指定字段并返回新对象。

```ts
import { extract } from 'uxiu/utils'

const source = { id: 1, name: 'uxiu', password: 'secret' }
const publicData = extract(source, ['id', 'name'])
// { id: 1, name: 'uxiu' }
```

配置项：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `containPrototype` | `true` | 是否读取原型链字段 |
| `notValueWriteUndefined` | `true` | 字段不存在时是否写入 `undefined` |

## `omit`

删除指定字段。默认返回浅拷贝，`.effect()` 会修改源对象。

```ts
import { omit } from 'uxiu/utils'

const source = { id: 1, password: 'secret' }
const publicData = omit(source, ['password'])

omit.effect(source, ['password'])
```

## `convertProps`

按配置转换或覆盖属性。配置值为函数时接收旧值。

```ts
import { convertProps } from 'uxiu/utils'

const source = { count: 2, enabled: false }
const result = convertProps(source, {
	count: (value) => value * 10,
	label: 'ready'
})
// { count: 20, enabled: false, label: 'ready' }
```

`convertProps.effect()` 会直接修改源对象。

## `hasEmpty`

判断对象或数组的可枚举自有值中是否包含 `undefined` 或 `null`。

```ts
hasEmpty({ id: 1, name: null }) // true
hasEmpty([1, undefined]) // true
```

传入非引用值会抛出 `TypeError`。

## `hasInvalid`

默认把以下值视为无效：

- `undefined`
- `null`
- `NaN`
- `Infinity`
- `-Infinity`

```ts
import { hasInvalid } from 'uxiu/utils'

hasInvalid({ id: 1, name: null }) // true
hasInvalid({ id: 1, name: null }, ['name']) // false
hasInvalid({ value: '' }, [], { '': true }) // true
```

`0` 与 `-0` 分别配置：

```ts
hasInvalid({ value: -0 }, [], {
	'0': true,
	'-0': true
})
```

## `safe`

将同步异常或 Promise 拒绝转换为错误优先元组。

```ts
import { safe } from 'uxiu/utils'

const [parseError, data] = safe(() => JSON.parse(input))

const [requestError, response] = await safe(() => fetch(url))
```

返回值始终是以下二者之一：

```ts
[undefined, result]
[error, undefined]
```
