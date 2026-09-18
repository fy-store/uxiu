import { isObject } from '../../utils/index.js'

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 判断错误是否由指定的可选 peer 依赖缺失引起。 */
function isMissingPeerDependency(error: unknown, name: string): boolean {
	if (!isObject(error) || !('code' in error)) return false
	if (error.code !== 'ERR_MODULE_NOT_FOUND' && error.code !== 'MODULE_NOT_FOUND') return false
	const message = error instanceof Error ? error.message : String(error)
	return new RegExp(`(?:^|["'])${escapeRegExp(name)}(?:["']|$)`).test(message)
}

/**
 * 动态加载可选 peer 依赖，并在依赖未安装时抛出包含安装命令的错误。
 *
 * @param name - peer 依赖包名，例如 `koa`。
 * @param description - 使用方模块的中文描述，用于拼装错误信息，例如 `createApp`。
 * @param loader - 实际执行动态导入的函数。
 * @returns 依赖加载结果。
 * @throws 依赖缺失时抛出提示安装命令的错误；依赖存在但加载失败时原样抛出。
 */
export async function loadPeerDependency<T>(
	name: string,
	description: string,
	loader: () => Promise<T>
): Promise<T> {
	try {
		return await loader()
	} catch (error) {
		if (isMissingPeerDependency(error, name)) {
			throw new Error(
				`${description}需要可选依赖 "${name}"，请先运行 "pnpm add ${name}"（或使用当前包管理器安装 ${name}）。`,
				{ cause: error }
			)
		}
		throw error
	}
}
