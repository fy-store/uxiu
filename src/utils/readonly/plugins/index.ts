export { createReadonlyMethodPlugin } from './createMethodPlugin.js'
export { dateReadonlyPlugin } from './date.js'
export { collectionReadonlyPlugin } from './collection.js'
export {
	arrayBufferReadonlyPlugin,
	dataViewReadonlyPlugin,
	typedArrayReadonlyPlugin,
	binaryReadonlyPlugins
} from './binary.js'

import { dateReadonlyPlugin } from './date.js'
import { collectionReadonlyPlugin } from './collection.js'
import {
	arrayBufferReadonlyPlugin,
	binaryReadonlyPlugins,
	dataViewReadonlyPlugin,
	typedArrayReadonlyPlugin
} from './binary.js'

export const readonlyPlugins = {
	date: dateReadonlyPlugin,
	collection: collectionReadonlyPlugin,
	arrayBuffer: arrayBufferReadonlyPlugin,
	dataView: dataViewReadonlyPlugin,
	typedArray: typedArrayReadonlyPlugin,
	binary: binaryReadonlyPlugins
} as const
