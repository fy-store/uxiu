# 类型判断

从 `uxiu/utils` 导入。

```ts
import {
	isArray,
	isEffectiveNumber,
	isObj,
	isObject,
	isReferenceValue
} from 'uxiu/utils'
```

## 基础类型守卫

| API | 判定条件 |
| --- | --- |
| `isArray(value)` | 数组 |
| `isBigint(value)` | `bigint` |
| `isBoolean(value)` | `boolean` |
| `isFunction(value)` | 函数 |
| `isNull(value)` | `null` |
| `isNumber(value)` | `number`，包括 `NaN` 和无穷值 |
| `isString(value)` | 字符串 |
| `isSymbol(value)` | `symbol` |
| `isUndefined(value)` | `undefined` |

这些方法都带有 `.all(...values)` 辅助方法：

```ts
isString.all('a', 'b') // true
isNumber.all(1, 2, 3) // true
```

多数 `.all()` 在没有参数时返回 `false`；`isEmpty.all()`、`isOriginValue.all()` 和 `isUndefined.all()` 在空参数时返回 `true`。

## 对象与引用值

```ts
isObject([]) // true
isObject(() => {}) // false

isObj({}) // true
isObj([]) // false

isReferenceValue(() => {}) // true
isReferenceValue([]) // true

isOriginValue('text') // true
isOriginValue(null) // true
```

| API | 数组 | 普通对象 | 函数 | `null` |
| --- | --- | --- | --- | --- |
| `isObject` | 是 | 是 | 否 | 否 |
| `isObj` | 否 | 是 | 否 | 否 |
| `isReferenceValue` | 是 | 是 | 是 | 否 |
| `isOriginValue` | 否 | 否 | 否 | 是 |

## 数字判断

### `isEffectiveNumber`

只接受有限的 `number`：

```ts
isEffectiveNumber(1.5) // true
isEffectiveNumber(NaN) // false
isEffectiveNumber(Infinity) // false
isEffectiveNumber(1n) // false
```

### `isEffectiveStrNumber`

接受有限数字和规范的十进制数字字符串：

```ts
isEffectiveStrNumber('-12.5') // true
isEffectiveStrNumber('01') // false
isEffectiveStrNumber('.5') // false
isEffectiveStrNumber('1e3') // false
isEffectiveStrNumber(' 1 ') // false
```

## 空值

`isEmpty(value)` 只判断 `undefined` 或 `null`，不会把空字符串、空数组和空对象视为空值。

```ts
isEmpty(undefined) // true
isEmpty(null) // true
isEmpty('') // false
isEmpty([]) // false
```
