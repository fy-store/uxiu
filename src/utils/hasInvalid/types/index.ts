export type HasInvalidAnyKeyObj = Record<string, boolean>

export interface HasInvalidVerifyConfig {
	/** undefined 默认为 true */
	undefined?: boolean
	/** null 默认为 true */
	null?: boolean
	/** NaN 默认为 true */
	NaN?: boolean
	/** Infinity 默认为 true */
	Infinity?: boolean
	/** -Infinity 默认为 true */
	'-Infinity'?: boolean
	/** '' 默认为 false */
	''?: boolean
	/** 0 默认为 false */
	'0'?: boolean
	/** -0 默认为 false */
	'-0'?: boolean
	/** false 默认为 false */
	false?: boolean
}
