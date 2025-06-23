export interface Options {
    /** sql 查询方法 */
	query: (...args: any[]) => Promise<any>
}
