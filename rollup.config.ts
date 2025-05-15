import type { RollupOptions } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { dts } from 'rollup-plugin-dts'

const config: RollupOptions[] = [
	{
		
		input: './src/index.ts',
		output: [
			{
				file: './dist/index.js',
				format: 'es'
			},
			{
				file: './dist/index.cjs.js',
				format: 'cjs'
			}
		],

		external: ['koa', 'path-to-regexp'],

		// ignore error see https://github.com/rollup/plugins/issues/1662
		plugins: [
			// @ts-expect-error error
			typescript(),
			nodeResolve({
				exportConditions: ['node']
			}),
			// @ts-expect-error error
			commonjs(),
			// @ts-expect-error error
			json()
		],
		onLog(_level, log) {
			if (log.id?.includes('node_modules') && log.id?.includes('depd')) {
				return
			}
			if (log.frame) {
				console.log(log.frame)
			}
		}
	},
	// 打包 d.ts
	{
		input: './src/index.ts',
		output: [
			{
				file: './dist/index.d.ts',
				format: 'es'
			},
			{
				file: './dist/index.cjs.d.ts',
				format: 'cjs'
			}
		],

		plugins: [
			// @ts-expect-error error
			typescript(),
			// @ts-expect-error error
			commonjs(),
			// @ts-expect-error error
			json(),
			dts()
		],
		onLog(_level, log) {
			if (log.id?.includes('node_modules') && log.id?.includes('depd')) {
				return
			}
			if (log.frame) {
				console.log(log.frame)
			}
		}
	}
]

export default config
