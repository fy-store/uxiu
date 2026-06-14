# DbFit

`DbFit` 用统一生命周期包装任意数据库客户端的查询方法，并提供事件、借用和条件辅助能力。

## 基础用法

```ts
import { DbFit } from 'uxiu/utils'

class UserRepository extends DbFit<{
	query: (sql: string, params: Record<string, unknown>) => Promise<unknown>
}> {
	constructor(client: DatabaseClient) {
		super({
			query: (sql, params) => client.query(sql, params)
		})
	}

	findById(id: number) {
		return this.query<{ id: number; name: string }>(
			'select * from user where id = :id',
			{ id }
		)
	}
}
```

## 状态

| 属性 | 说明 |
| --- | --- |
| `bus` | `event-imt` 事件总线 |
| `queryCount` | 已调用查询次数 |
| `isDestroyed` | 是否已销毁或提交 |
| `borrow` | 当前借用的 DbFit 实例 |

实例销毁后再次 `query()` 会抛出异常。

## 方法总览

| 方法 | 说明 |
| --- | --- |
| `query(...args)` | 执行查询并触发生命周期事件 |
| `destroy(emitEvent?, ...args)` | 销毁实例，可选择是否触发销毁事件 |
| `submit(...args)` | 提交并结束实例 |
| `ifel(condition, truthy, falsy?)` | 布尔条件分支 |
| `ifVoid(condition, whenVoid, then?)` | `undefined` 条件分支 |
| `ifNotVoid(condition, whenNotVoid, then?)` | 非 `undefined` 条件分支 |
| `[Symbol.dispose]()` | `using` 块结束时自动调用销毁逻辑 |

`ifel`、`ifVoid` 和 `ifNotVoid` 同时提供同名静态方法。`catchErrorProxy` 只作为静态方法提供。

## 生命周期事件

```ts
repository.bus.on('hook:beforeQuery', async (_self, sql) => {
	console.log('before', sql)
})

repository.bus.on('afterQuery', (_self, sql) => {
	console.log('after', sql)
})

repository.bus.on('destroy', (_self, context) => {
	console.log(context.emitType)
})
```

| 事件 | 时机 |
| --- | --- |
| `firstQuery` / `hook:firstQuery` | 第一次查询 |
| `beforeQuery` / `hook:beforeQuery` | 每次查询之前 |
| `afterQuery` / `hook:afterQuery` | 查询成功之后 |
| `destroy` / `hook:destroy` | 出错、`destroy()` 或 `submit()` |

`hook:*` 使用等待式触发；无 `hook:` 的事件不阻塞查询流程。

## `destroy` 与 `submit`

```ts
await repository.destroy()
await repository.submit()
```

两者都会把实例标记为不可继续查询。区别通过 `destroy` 事件的 `emitType` 表达：

- `callDestroy`
- `callSubmit`
- `error`

## 借用实例

借用后，查询、事件总线和状态都指向被借用实例，适合共享事务或连接。

```ts
const transaction = new DbFit({ query: transactionQuery })
const users = new DbFit({
	query: transactionQuery,
	borrow: transaction
})
```

## 条件辅助

```ts
DbFit.ifel(enabled, 'enabled', 'disabled')
DbFit.ifVoid(value, 'IS NULL', () => value)
DbFit.ifNotVoid(value, (current) => current, 'fallback')
```

每个静态方法也有实例版本。

## 错误代理

`catchErrorProxy()` 在对象方法同步抛错或 Promise 拒绝时执行回调，然后继续抛出原错误。

```ts
return DbFit.catchErrorProxy(this, async (self) => {
	await self.destroy()
})
```
