# API 总览

uxiu 按运行环境分为三个模块。下表列出当前所有公开的运行时 API；类型声明请在对应详情页和编辑器提示中查看。

| 入口 | 源码目录 | 运行环境 |
| --- | --- | --- |
| `uxiu/utils` | `src/utils` | 所有 JavaScript 环境，不依赖宿主环境 API |
| `uxiu/dependence` | `src/dependence` | 依赖计时器、时间或加密随机数等宿主环境 API |
| `uxiu/node` | `src/node` | 只能在 Node.js 中运行 |
| `uxiu` | `src/index.ts` | 聚合以上全部 API，运行环境取决于实际使用的工具 |

::: warning 按环境导入
浏览器、Worker 等非 Node.js 项目不要从 `uxiu` 或 `uxiu/node` 导入。应使用更具体的 `uxiu/utils` 或 `uxiu/dependence` 入口。
:::

## `uxiu/utils`

该入口只使用 JavaScript 语言能力和项目依赖，不读取浏览器、Node.js 等宿主环境 API。

### 类型与值判断

| API | 附属方法 | 说明 |
| --- | --- | --- |
| `isObject(value)` | `isObject.all(...values)` | 判断对象或数组，排除函数与 `null` |
| `isObj(value)` | `isObj.all(...values)` | 判断非数组对象 |
| `isArray(value)` | `isArray.all(...values)` | 判断数组 |
| `isNull(value)` | `isNull.all(...values)` | 判断 `null` |
| `isUndefined(value)` | `isUndefined.all(...values)` | 判断 `undefined` |
| `isNumber(value)` | `isNumber.all(...values)` | 判断 `number`，包含 `NaN` 和无穷值 |
| `isEffectiveNumber(value)` | `isEffectiveNumber.all(...values)` | 判断有限 `number` |
| `isEffectiveStrNumber(value)` | - | 判断有限数字或规范十进制数字字符串 |
| `isString(value)` | `isString.all(...values)` | 判断字符串 |
| `isBoolean(value)` | `isBoolean.all(...values)` | 判断布尔值 |
| `isBigint(value)` | `isBigint.all(...values)` | 判断 `bigint` |
| `isSymbol(value)` | `isSymbol.all(...values)` | 判断 `symbol` |
| `isFunction(value)` | `isFunction.all(...values)` | 判断函数 |
| `isReferenceValue(value)` | `isReferenceValue.all(...values)` | 判断对象、数组或函数 |
| `isOriginValue(value)` | `isOriginValue.all(...values)` | 判断原始值 |
| `isEmpty(value)` | `isEmpty.all(...values)` | 判断 `undefined` 或 `null` |

### 对象与执行工具

| API | 附属方法 | 说明 |
| --- | --- | --- |
| `extract(target, keys, options?)` | - | 提取指定字段 |
| `omit(target, keys)` | `omit.effect(target, keys)` | 剔除字段；`effect` 修改原对象 |
| `convertProps(target, props)` | `convertProps.effect(target, props)` | 转换属性；`effect` 修改原对象 |
| `hasEmpty(target)` | - | 判断自有可枚举值中是否存在空值 |
| `hasInvalid(target, ignoreField?, config?)` | - | 按配置判断无效值 |
| `safe(fn)` | - | 将同步异常或 Promise 拒绝转换为元组 |

### 只读代理

| API | 说明 |
| --- | --- |
| `readonly(target, options?)` | 创建深层只读代理 |
| `readonly.shallowReadonly(target, options?)` | 创建浅层只读代理 |
| `readonly.isReadonly(target)` | 判断是否为只读代理 |
| `readonly.isDeepReadonly(target)` | 判断是否为深层只读代理 |
| `readonly.isShallowReadonly(target)` | 判断是否为浅层只读代理 |
| `readonly.toOrigin(target, sign?)` | 获取代理对应的原对象 |
| `readonly.getTip(target)` | 获取只读代理的提示策略 |
| `readonly.plugins` | 内置插件集合 |
| `createReadonlyMethodPlugin(options)` | 创建阻止指定方法的只读插件 |
| `dateReadonlyPlugin` | Date 只读插件 |
| `collectionReadonlyPlugin` | Map、Set、WeakMap、WeakSet 只读插件 |
| `arrayBufferReadonlyPlugin` | ArrayBuffer 只读插件 |
| `dataViewReadonlyPlugin` | DataView 只读插件 |
| `typedArrayReadonlyPlugin` | TypedArray 只读插件 |
| `binaryReadonlyPlugins` | 二进制只读插件数组 |
| `readonlyPlugins` | 全部内置插件的具名集合 |

### `DbFit`

| API | 说明 |
| --- | --- |
| `new DbFit(options)` | 创建数据库查询生命周期适配器 |
| `db.query(...args)` | 执行查询 |
| `db.destroy(emitEvent?, ...args)` | 销毁实例 |
| `db.submit(...args)` | 提交并结束实例 |
| `db.ifel(...)` / `DbFit.ifel(...)` | 布尔条件分支 |
| `db.ifVoid(...)` / `DbFit.ifVoid(...)` | `undefined` 条件分支 |
| `db.ifNotVoid(...)` / `DbFit.ifNotVoid(...)` | 非 `undefined` 条件分支 |
| `DbFit.catchErrorProxy(target, callback)` | 捕获对象方法错误、执行回调并继续抛错 |
| `db[Symbol.dispose]()` | 支持 `using` 语法自动销毁 |

实例还公开 `bus`、`queryCount`、`isDestroyed` 和 `borrow` 只读属性。

## `uxiu/dependence`

这些工具依赖宿主提供的 API，因此使用前需要确认目标运行环境具备对应能力。

| API | 附属方法 | 宿主环境依赖 |
| --- | --- | --- |
| `random(min, max)` | `random.randomStr()`、`random.random26az()`、`random.random26AZ()`、`random.random0toaZ()`、`random.random0toaz()` | `globalThis.crypto.getRandomValues` |
| `sleep(time, callback?)` | `sleep.sync(time, callback?)` | `setTimeout`、`Date` |
| `everydayTask(callback, options?)` | 返回停止函数 | `setTimeout`、`clearTimeout`、`Date`、Promise 微任务 |
| `debounce(fn, delay, options?)` | 返回函数的 `cancel()`、`flush(...args)` | `setTimeout`、`clearTimeout` |
| `throttle(fn, delay, options?)` | 返回函数的 `cancel()` | `setTimeout`、`clearTimeout`、`Date.now` |

`random` 还公开只读字符表：`random.az`、`random.AZ`、`random.num`、`random.sign` 和 `random.all`。

## `uxiu/node`

该入口包含 Node.js 内置模块、进程能力或 Node.js 服务端生态依赖，只能在 Node.js 中使用。

### 顶层 API

| API | 说明 | 可选依赖 |
| --- | --- | --- |
| `createApp(config?)` | 创建并监听 Koa 应用 | `koa`，启用日志时还需 `log4js` |
| `createLogger(options)` | 创建 log4js 日志实例 | `log4js` |
| `createRequestInspector()` | 创建请求规则检查器 | `path-to-regexp` |
| `new SessionStore()` | 创建会话存储工厂 | - |
| `getLocalIP()` | 读取非内部 IPv4 地址 | - |

### 请求检查器方法

`createRequestInspector()` 返回的对象提供：

| 方法 | 说明 |
| --- | --- |
| `create(configs, options?)` | 编译请求规则 |
| `check(rules, method, path)` | 检查请求是否匹配 |
| `getConf(rules)` | 从规则还原配置 |
| `rulesToSerialize(rules)` | 把规则转换为可序列化结构 |
| `serializeToRules(data)` | 把序列化结构恢复为规则 |

### 会话存储方法

`SessionStore` 实例提供：

| 方法 | 说明 |
| --- | --- |
| `create(options?)` | 创建会话存储操作对象 |
| `createSessionId()` | 生成会话 ID |
| `sessionclone(data)` | 使用 JSON 序列化克隆数据 |
| `createMemoryStoreOptions()` | 创建内存存储适配器 |
| `createSessionStore(options?)` | `create()` 的废弃别名 |

`create()` 返回的操作对象提供：

| 方法 | 说明 |
| --- | --- |
| `get(id)` / `has(id)` | 获取或判断会话 |
| `set(id, value)` / `patch(id, value)` | 替换或浅合并会话 |
| `create(value)` / `customCreate(id, value)` | 创建会话 |
| `del(id)` / `delete(id)` | 删除会话 |
| `each(callback)` | 遍历会话 |
| `all()` / `keys()` / `values()` | 读取会话集合 |
| `clear()` | 清空会话 |
| `length()` | 获取会话数量 |

### 其他附属 API

| API | 说明 |
| --- | --- |
| `getLocalIP.getPrimaryLocalIP()` | 获取主要本地 IPv4 地址 |
| `logger.app` / `logger.debug` / `logger.crash` / `logger.console` | `createLogger()` 创建的默认日志分类 |

日志分类提供的方法来自 `log4js.Logger`；自定义 `expandCategories` 会增加同名分类属性。
