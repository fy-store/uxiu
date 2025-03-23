import type { Conf, Options, Rule, Method } from './types/index.js'
import { isArray, isBoolean, isObject, isString } from '../../utils/index.js'
import { pathToRegexp } from 'path-to-regexp'
import path from 'path/posix'

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'] as const

/**
 * 创建一个 path 规则
 * @param confs 规则配置
 * @param options 配置选项
 */
export function create(confs: Conf[], options: Options = {}): Rule[] {
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

		return {
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
	})
}

/**
 * 验证 path
 * @param rules 规则列表
 * @param method 方法
 * @param path 路径
 */
export function check(rules: Rule[], method: Method, path: string) {
	return rules.some((rule) => {
		return rule.methods.includes(method) && rule.regex.test(path)
	})
}

/**
 * 获取规则中的配置
 * @param rules 规则列表
 */
export function getConf(rules: Rule[]) {
	return rules.map((rule) => {
		return {
			methods: [...rule.methods],
			path: rule.path
		}
	})
}
