# 请求检查器

请求检查器把 HTTP 方法与路径配置编译为规则，用于权限、白名单和中间件分流。

```bash
pnpm add path-to-regexp
```

## 创建规则

```ts
import { createRequestInspector } from 'uxiu/node'

const inspector = await createRequestInspector()

const rules = inspector.create(
	[
		{ methods: 'GET', path: '/health', meta: { public: true } },
		{ methods: ['GET', 'POST'], path: '/users/*' },
		{ methods: '*', path: '/assets/*' }
	],
	{
		base: '/api',
		sensitive: true,
		trailing: false
	}
)
```

路径只允许字母、数字、`_`、`-`、`/` 和 `*`。`*` 表示任意字符。

## 检查请求

```ts
inspector.check(rules, 'GET', '/api/health') // true
inspector.check(rules, 'DELETE', '/api/health') // false
```

`method` 或 `path` 为 `null` 时返回 `false`。

## 规则元数据

`meta` 会贯穿创建、配置提取和序列化过程：

```ts
const rules = inspector.create<{ permission: string }>([
	{
		methods: 'GET',
		path: '/admin',
		meta: { permission: 'admin:read' }
	}
])
```

`{ methods: null, path: null }` 可作为不可匹配但可携带元数据的规则。

## 配置与序列化

```ts
const config = inspector.getConf(rules)

const serialized = inspector.rulesToSerialize(rules)
const restored = inspector.serializeToRules(serialized)
```

`rulesToSerialize()` 把 RegExp 转换为 `{ source, flags }`，适合写入 JSON 或跨进程传输。
