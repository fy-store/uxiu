export type ConvertPropsTarget<T1, T2> = {
	[K in keyof T1 as K extends keyof T2 ? never : K]: T1[K]
}

export type ConvertPropsProps<T> = {
	[K in keyof T]: T[K] extends (value: any) => infer R ? R : T[K]
}