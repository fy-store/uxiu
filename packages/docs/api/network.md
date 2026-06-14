# 本地 IP

`getLocalIP` 读取系统网络接口中的非内部 IPv4 地址。

```ts
import { getLocalIP } from 'uxiu/node'

const addresses = getLocalIP()
const primary = getLocalIP.getPrimaryLocalIP()
```

## `getLocalIP()`

返回所有符合条件的 IPv4 地址：

```ts
string[]
```

不会包含回环地址和 IPv6 地址。

## `getPrimaryLocalIP()`

优先返回以下私有网段中的地址：

- `192.168.*`
- `10.*`
- `172.*`

没有私有地址时返回第一个可用地址；仍未找到时返回 `127.0.0.1`。

::: info 容器与代理
该方法读取进程所在系统或容器的网络接口，不代表客户端地址，也不一定是公网可访问地址。
:::
