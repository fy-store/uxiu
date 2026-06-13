import { createReadonlyMethodPlugin } from './createMethodPlugin.js'

const dateMutationMethods = [
	'setDate',
	'setFullYear',
	'setHours',
	'setMilliseconds',
	'setMinutes',
	'setMonth',
	'setSeconds',
	'setTime',
	'setUTCDate',
	'setUTCFullYear',
	'setUTCHours',
	'setUTCMilliseconds',
	'setUTCMinutes',
	'setUTCMonth',
	'setUTCSeconds',
	'setYear'
] as const

/** 阻止 Date 的 set* 方法修改日期 */
export const dateReadonlyPlugin = createReadonlyMethodPlugin<Date>({
	name: 'date',
	match: (target): target is Date => target instanceof Date,
	methods: dateMutationMethods
})
