# 计时、随机与频率控制

从 `uxiu/dependence` 导入。

这些工具依赖运行环境提供的 `crypto`、计时器或时间 API，不属于纯 JavaScript 环境无关工具。

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

## `debounce`

在连续调用停止指定时间后执行函数。默认在尾部执行；`immediate: true` 时改为首次调用立即执行。

```ts
import { debounce } from 'uxiu/dependence'

const search = debounce(
	(keyword: string) => {
		console.log(keyword)
	},
	300
)

search('u')
search('uxiu')

search.cancel()
search.flush('立即执行')
```

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `immediate` | `false` | 是否在首次调用时立即执行 |

返回的防抖函数提供：

- `cancel()`：取消等待中的调用。
- `flush(...args)`：存在等待任务时取消计时，并使用本次参数立即执行。

## `throttle`

限制函数在指定时间内最多执行一次。

```ts
import { throttle } from 'uxiu/dependence'

const report = throttle(
	(value: number) => {
		console.log(value)
	},
	1000,
	{
		immediately: true,
		trailing: true
	}
)

report(1)
report.cancel()
```

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `immediately` | `true` | 是否允许首次调用立即执行 |
| `trailing` | `false` | 限制期间再次调用后，是否在尾部补充执行一次 |

返回函数的 `cancel()` 会清除尾部任务并重置节流状态。
