export interface ExtractOptions {
	/** 是否包含原型链上的属性, 默认为 true(包含原型) */
	containPrototype?: boolean
	/**  获取目标字段不存在时是否写入 undefined, 若不写入则结构中不会包含该字段, 默认为 true(写入undefined) */
	notValueWriteUndefined?: boolean
}
