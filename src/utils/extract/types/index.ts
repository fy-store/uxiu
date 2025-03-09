export interface ExtractOptions {
	/** 是否包含原型链上的属性, 默认为 true */
	containPrototype?: boolean
	/** 当获取不到数据时写入 undefined, 若不写入则结构中不会包含该字段, 默认为 true */
	notValueWriteUndefined?: boolean
}
