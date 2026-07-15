import { businessLogger, createLogger } from './index.js'

const mode = process.argv[2]
const storageDirPath = process.argv[3]

if (!storageDirPath) throw new Error('missing log storage path')

await createLogger({
	storageDirPath,
	registerFatalHandler: true
})

businessLogger.info({ mode }, 'last business log before process exit')

if (mode === 'crash') {
	setImmediate(() => {
		throw new Error('fixture process crashed')
	})
} else {
	process.exit(0)
}
