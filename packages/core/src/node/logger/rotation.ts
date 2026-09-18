import type { DestinationStream } from 'pino'
import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import type { LoggerRotationInterval, LoggerRotationOptions } from './types.js'

/** 单个文件未显式配置大小上限时使用的默认值：5MB。 */
export const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024

/** pino 文件目标在生命周期管理中使用的 SonicBoom 方法子集。 */
export interface ManagedDestination extends DestinationStream {
	fd?: number
	flush(cb: (error?: Error) => void): void
	flushSync(): void
	end(): void
	on(event: 'close' | 'error' | 'finish' | 'ready', listener: (...args: any[]) => void): this
	once(event: 'close' | 'error' | 'finish' | 'ready', listener: (...args: any[]) => void): this
	removeListener(event: 'close' | 'error' | 'finish' | 'ready', listener: (...args: any[]) => void): this
}

/** 创建底层 pino 文件目标；由调用方注入以复用 `pino.destination`。 */
export type DestinationFactory = (dest: string) => ManagedDestination

/** 补齐默认值后的轮转配置。 */
export interface ResolvedRotationOptions {
	/** 按时间切分文件的周期；`null` 表示只按大小轮转。 */
	interval: LoggerRotationInterval | null
	/** 单个文件大小上限（字节）；`null` 表示只按时间轮转。 */
	maxFileSize: number | null
}

/**
 * 解析用户的 `rotation` 配置。
 *
 * @returns 需要轮转时返回补齐默认值的配置；显式关闭或时间与大小都关闭时返回 `undefined`，
 * 表示写入单个固定文件 `<category>.log`。
 */
export function resolveRotationOptions(
	rotation?: LoggerRotationOptions
): ResolvedRotationOptions | undefined {
	if (!rotation) return { interval: 'daily', maxFileSize: DEFAULT_MAX_FILE_SIZE }
	if (rotation.enabled === false) return undefined
	const interval = rotation.interval === undefined ? 'daily' : rotation.interval
	const maxFileSize = rotation.maxFileSize === undefined ? DEFAULT_MAX_FILE_SIZE : rotation.maxFileSize
	if (interval === false && maxFileSize === false) return undefined
	return {
		interval: interval === false ? null : interval,
		maxFileSize: maxFileSize === false ? null : maxFileSize
	}
}

function pad(value: number): string {
	return String(value).padStart(2, '0')
}

/** 生成文件名中的时间片段，例如 `2026-09-18` 或 `2026-09-18-09`。 */
function formatTimeKey(date: Date, interval: LoggerRotationInterval): string {
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
	return interval === 'hourly' ? `${day}-${pad(date.getHours())}` : day
}

/**
 * 按时间周期和大小上限轮转日志文件的 pino 目标。
 *
 * @remarks
 * 该目标把写入转发给当前打开的 SonicBoom，并在时间片段变化或当前文件超过大小上限时，
 * 关闭旧文件并按 `<category>-<时间片段>[.<序号>].log` 打开新文件。进程重启后会继续写入
 * 当前时间片段下序号最大的文件，避免同一天产生大量碎片文件。
 */
export class RotatingFileDestination extends EventEmitter implements ManagedDestination {
	private boom?: ManagedDestination
	private timeKey = ''
	private sequence = 0
	private bytes = 0
	private ended = false

	constructor(
		private readonly options: {
			directory: string
			baseName: string
			interval: LoggerRotationInterval | null
			maxFileSize: number | null
		},
		private readonly createDestination: DestinationFactory
	) {
		super()
		const timeKey = this.currentTimeKey()
		this.open(timeKey, this.resolveInitialSequence(timeKey))
	}

	get fd(): number | undefined {
		return this.boom?.fd
	}

	write(chunk: string): void {
		if (this.ended) return
		const size = Buffer.byteLength(chunk)
		if (this.shouldRotate(size)) this.rotate()
		if (!this.boom) return
		this.bytes += size
		this.boom.write(chunk)
	}

	flush(cb: (error?: Error) => void): void {
		if (this.boom) this.boom.flush(cb)
		else cb()
	}

	flushSync(): void {
		this.boom?.flushSync()
	}

	end(): void {
		if (this.ended) return
		this.ended = true
		const boom = this.boom
		this.boom = undefined
		if (!boom) {
			this.emit('close')
			return
		}
		boom.once('close', () => this.emit('close'))
		boom.once('finish', () => this.emit('finish'))
		boom.once('error', (error: Error) => this.emit('error', error))
		boom.end()
	}

	private currentTimeKey(): string {
		return this.options.interval ? formatTimeKey(new Date(), this.options.interval) : ''
	}

	private fileName(timeKey: string, sequence: number): string {
		const stem = this.options.interval ? `${this.options.baseName}-${timeKey}` : this.options.baseName
		const suffix = sequence > 0 ? `.${sequence}` : ''
		return path.join(this.options.directory, `${stem}${suffix}.log`)
	}

	/** 找到当前时间片段下已存在的最大序号，用于重启后继续追加而不是新建碎片文件。 */
	private resolveInitialSequence(timeKey: string): number {
		const stem = this.options.interval ? `${this.options.baseName}-${timeKey}` : this.options.baseName
		let max = 0
		for (const entry of fs.readdirSync(this.options.directory)) {
			if (!entry.startsWith(`${stem}.`) || !entry.endsWith('.log')) continue
			const middle = entry.slice(stem.length + 1, -'.log'.length)
			if (/^\d+$/.test(middle)) max = Math.max(max, Number(middle))
		}
		return max
	}

	private shouldRotate(size: number): boolean {
		if (!this.boom) return true
		if (this.options.interval && this.currentTimeKey() !== this.timeKey) return true
		const { maxFileSize } = this.options
		// 单条日志超过上限时仍然写入，避免因无法分割单条记录而反复轮转。
		return maxFileSize !== null && this.bytes > 0 && this.bytes + size > maxFileSize
	}

	private rotate(): void {
		this.boom?.end()
		const timeKey = this.currentTimeKey()
		this.open(timeKey, timeKey === this.timeKey ? this.sequence + 1 : 0)
	}

	private open(timeKey: string, sequence: number): void {
		const dest = this.fileName(timeKey, sequence)
		const boom = this.createDestination(dest)
		this.boom = boom
		this.timeKey = timeKey
		this.sequence = sequence
		this.bytes = readFileSize(dest)
		boom.on('ready', () => this.emit('ready'))
		boom.on('error', (error: Error) => this.emit('error', error))
	}
}

function readFileSize(dest: string): number {
	try {
		return fs.statSync(dest).size
	} catch {
		return 0
	}
}
