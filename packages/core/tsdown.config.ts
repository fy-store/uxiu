import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: {
		index: './src/index.ts',
		utils: './src/utils/index.ts',
		dependence: './src/dependence/index.ts',
		node: './src/node/index.ts'
	},
	outDir: './dist',
	target: 'es2020',
	platform: 'node',
	// exports: true,
	unbundle: true
})
