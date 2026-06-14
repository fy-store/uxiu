# 异步与随机工具

从 `uxiu/dependence` 导入。

## `random`

生成密码学安全的随机整数，范围为 `min <= n < max`。

```ts
import { random } from 'uxiu/dependence'

const code = random(100000, 1000000)
```

约束：

- `min` 和 `max` 必须是安全整数
- `max` 必须大于 `min`
- 范围必须小于 `2^48`
- 使用 `globalThis.crypto.getRandomValues()`

### 随机字符串

```ts
random.randomStr(24)
random.random26az(12)
random.random26AZ(12)
random.random0toaZ(16)
random.random0toaz(16)
random.randomStr(8, ['A', 'B', 'C', '1', '2'])
```

可用只读字符表：`random.az`、`random.AZ`、`random.num`、`random.sign`、`random.all`。

## `sleep`

```ts
import { sleep } from 'uxiu/dependence'

await sleep(500)
const result = await sleep(500, () => 'done')
```

`sleep.sync()` 会阻塞当前线程，只适用于脚本或明确需要同步等待的场景：

```ts
sleep.sync(50)
```

## `everydayTask`

按本地时区在每日固定时间执行任务。

```ts
import { everydayTask } from 'uxiu/dependence'

const stop = everydayTask(
	(clearTimer) => {
		console.log('daily cleanup')

		if (shouldStop) {
			clearTimer()
		}
	},
	{
		hour: 2,
		minute: 30,
		second: 0
	}
)

// 在外部停止下一次任务
stop()
```

配置范围：

| 字段 | 范围 | 默认值 |
| --- | --- | --- |
| `hour` | 0-23 | 0 |
| `minute` | 0-59 | 0 |
| `second` | 0-59 | 0 |
| `millisecond` | 0-999 | 0 |
| `exceedImmediatelyExecute` | boolean | false |
| `thisContext` | 任意值 | undefined |

该工具基于 `setTimeout`，会校正下一次等待时间，但不适合作为强实时调度器。
