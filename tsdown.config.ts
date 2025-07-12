import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: {
		index: './src/index.ts',
		utils: './src/utils/index.ts',
		dependentUtils: './src/dependentUtils/index.ts'
	},
    outDir: './dist',
	target: 'es2020',
	platform: 'node',
	exports: true,
	unbundle: true
})
