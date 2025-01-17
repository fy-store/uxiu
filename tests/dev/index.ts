import { random, everydayTask } from '@/common/index.js'

everydayTask(
	() => {
		console.log(random.randomStr(16, random.all))
	},
	{ exceedImmediatelyExecute: true, hour: 1, minute: 12 }
)
