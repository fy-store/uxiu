import { networkInterfaces } from 'os'

/**
 * 获取本地IP地址
 * @returns 返回本地IP地址数组，优先返回IPv4地址
 */
export function getLocalIP(): string[] {
	const interfaces = networkInterfaces()
	const ips: string[] = []

	for (const name in interfaces) {
		const interfaceList = interfaces[name]
		if (!interfaceList) continue
		for (const interfaceInfo of interfaceList) {
			// 过滤掉内部（即127.0.0.1）和非IPv4地址
			if (!interfaceInfo.internal && interfaceInfo.family === 'IPv4') {
				ips.push(interfaceInfo.address)
			}
		}
	}
	return ips
}

/**
 * 获取主要的本地IP地址
 * @returns 返回主要的本地IP地址，如果没有找到则返回127.0.0.1
 */
getLocalIP.getPrimaryLocalIP = function getPrimaryLocalIP(): string {
	const ips = getLocalIP()
	// 优先返回192.168.x.x或10.x.x.x网段的IP
	const privateIP = ips.find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.'))
	return privateIP || ips[0] || '127.0.0.1'
}
