import type { InspectorConf, InspectorOptions, InspectorRule, InspectorMethod, InspectorRuleConf, InspectorRuleSerialize } from './types/index.js'
import { isArray, isBoolean, isObject, isString } from '../../utils/index.js'
import { pathToRegexp } from 'path-to-regexp'
import path from 'path/posix'
export * from './types/index.js'

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'] as const

/**
 * 创建一个 path 规则
 * @param confs 规则配置
 * @param options 配置选项
 */
export function create<T = any>(confs: InspectorConf<T>[], options: InspectorOptions = {}): InspectorRule<T>[] {
	if (!isArray(confs)) {
		throw new TypeError('confs must be an array')
	}

	if (!isObject(options)) {
		throw new TypeError('options must be an object')
	}

	const { base = '/', sensitive = true, trailing = false } = options

	if (!isString(base)) {
		throw new TypeError('options.base must be an string')
	}

	if (!isBoolean(sensitive)) {
		throw new TypeError('options.sensitive must be an boolean')
	}

	if (!isBoolean(trailing)) {
		throw new TypeError('options.trailing must be an boolean')
	}

	return confs.map((conf, i) => {
		if (!isObject(conf)) {
			throw new TypeError(`options.confs[${i}] must be an object`)
		}

		if (isString(conf.methods)) {
			if (!(conf.methods === '*' || methods.includes(conf.methods))) {
				throw new Error(`options.confs[${i}].methods must be one of ${methods.join(' | ')} or *`)
			}
		} else if (isArray(conf.methods)) {
			conf.methods.forEach((method, j) => {
				if (!methods.includes(method)) {
					throw new Error(`options.confs[${i}].methods[${j}] must be one of ${methods.join(' | ')}`)
				}
			})
		} else {
			throw new TypeError(
				`options.confs[${i}].methods must be one of ${methods.join(' | ')} or ${methods.join(' | ')}[] or *`
			)
		}

		if (!isString(conf.path)) {
			throw new TypeError(`options.confs[${i}].path must be an string`)
		}

		const checkPathReg = /^[a-zA-Z0-9-_\/*]+$/
		if (!(checkPathReg.test(base) && checkPathReg.test(conf.path))) {
			throw new Error(`options.confs[${i}].path must be a valid path, but got "${conf.path}"`)
		}

		const p = path.join(base, conf.path)

		const result: InspectorRule<T> = {
			methods: (function () {
				if (conf.methods === '*') {
					return [...methods]
				}
				if (isArray(conf.methods)) return conf.methods
				return [conf.methods]
			})(),
			path: p,
			regex: pathToRegexp(p.replaceAll('*', '{:_}'), { sensitive, trailing, end: true, delimiter: '/' }).regexp
		}

		if (Object.hasOwn(conf, 'meta')) {
			result.meta = conf.meta
		}

		return result
	})
}

/**
 * 验证 path
 * @param rules 规则列表
 * @param method 方法
 * @param path 路径
 */
export function check<T = any>(rules: InspectorRule<T>[], method: InspectorMethod, path: string) {
	return rules.some((rule) => {
		return rule.methods.includes(method) && rule.regex.test(path)
	})
}

/**
 * 获取规则中的配置
 * @param rules 规则列表
 */
export function getConf<T = any>(rules: InspectorRule<T>[]): InspectorRuleConf<T>[] {
	return rules.map((rule) => {
		const result: InspectorRuleConf<T> = {
			methods: [...rule.methods],
			path: rule.path
		}
		if (Object.hasOwn(rule, 'meta')) {
			result.meta = rule.meta
		}
		return result
	})
}

/**
 * 规则序列化
 * @param rules 规则列表
 */
export function rulesToSerialize<T = any>(rules: InspectorRule<T>[]): InspectorRuleSerialize<T>[] {
	return rules.map((rule) => {
		const result: InspectorRuleSerialize<T> = {
			methods: [...rule.methods],
			path: rule.path,
			regex: {
				source: rule.regex.source,
				flags: rule.regex.flags
			}
		}
		if (Object.hasOwn(rule, 'meta')) {
			result.meta = rule.meta
		}
		return result
	})
}

/**
 * 序列化转回规则
 * @param rules 序列化规则列表
 */
export function serializeToRules<T = any>(ruleSerializes: InspectorRuleSerialize<T>[]): InspectorRule<T>[] {
	return ruleSerializes.map((rule) => {
		const result: InspectorRule<T> = {
			methods: [...rule.methods],
			path: rule.path,
			regex: new RegExp(rule.regex.source, rule.regex.flags)
		}
		if (Object.hasOwn(rule, 'meta')) {
			result.meta = rule.meta
		}
		return result
	})
}
