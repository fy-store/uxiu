# 会话存储

`SessionStore` 提供异步存储接口、默认内存实现和只读读取结果。

## 内存存储

```ts
import { SessionStore } from 'uxiu/node'

type Session = {
	userId: number
	name: string
}

const sessions = new SessionStore().create<Session>()

const id = await sessions.create({
	userId: 1,
	name: 'admin'
})

const session = await sessions.get(id)
await sessions.patch(id, { name: 'root' })
await sessions.delete(id)
```

存入数据时会通过 JSON 序列化克隆，因此数据必须可 JSON 序列化。读取结果是深层只读代理。

## 方法

### `SessionStore` 实例

| 方法 | 说明 |
| --- | --- |
| `create(options?)` | 创建会话存储操作对象 |
| `createSessionId()` | 生成 UUID 与时间戳组成的会话 ID |
| `sessionclone(data)` | 使用 JSON 序列化克隆数据 |
| `createMemoryStoreOptions()` | 创建默认内存存储适配器 |
| `createSessionStore(options?)` | `create()` 的废弃别名 |

### `create()` 返回对象

| 方法 | 说明 |
| --- | --- |
| `get(id)` | 获取会话，不存在时抛错 |
| `has(id)` | 判断会话是否存在 |
| `set(id, value)` | 替换已存在会话 |
| `create(value)` | 生成 ID 并创建会话 |
| `customCreate(id, value)` | 使用自定义 ID 创建 |
| `patch(id, value)` | 浅合并补丁 |
| `del(id)` / `delete(id)` | 删除并返回旧值 |
| `each(callback)` | 遍历会话 |
| `all()` | 返回 `[id, value][]` |
| `keys()` | 返回全部 ID |
| `values()` | 返回全部值 |
| `clear()` | 删除全部会话 |
| `length()` | 返回会话数量 |

## 自定义存储

适配 Redis、数据库或文件存储时实现 `SessionStoreStore<T>`：

```ts
interface SessionStoreStore<T> {
	add(id: string, value: T): Promise<T>
	get(id: string): Promise<T>
	set(id: string, value: T): Promise<T>
	del(id: string): Promise<T>
	each(fn: (id: string, value: T) => void): Promise<void>
	length(): Promise<number>
}
```

```ts
const sessions = new SessionStore().create<Session>({
	store: redisStore,
	load: [
		['initial-session', { userId: 1, name: 'admin' }]
	]
})
```

::: warning 并发语义
`patch()`、`clear()` 等复合操作依赖存储接口的多个调用。需要强一致性时，应在自定义存储实现或外层业务中增加事务和锁。
:::
