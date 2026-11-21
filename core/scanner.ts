import type { MailAdapter, MailCandidate } from "@/shared/interfaces/mail"

import { sleep } from "@/shared/utils"

import { isRejectionFormat } from "./patterns"
import { incrementRejectionCount, isAutoReadItem, isPausedItem, rejectionTagItem } from "./storage"

const SCAN_THROTTLE_MILLIS = 1500
const RETRY_MILLIS = 5000
const BODY_FETCH_GAP_MILLIS = 400

/** Subject + snippet first, fetches full body if preview is inconclusive */
async function isRejection(adapter: MailAdapter, candidate: MailCandidate): Promise<boolean> {
	if (isRejectionFormat(`${candidate.subject} ${candidate.snippet}`)) return true

	await sleep(BODY_FETCH_GAP_MILLIS)

	return isRejectionFormat(await adapter.fetchBody(candidate))
}

export class Scanner {
	private readonly adapter: MailAdapter
	private readonly logPrefix: string

	private isPaused = false
	private isScanning = false
	private isAutoRead = true
	private labelName = ""

	private timer: ReturnType<typeof setTimeout> | undefined

	/** Classified as "not a rejection", already marked, or failed (retried on resume or reload) */
	private readonly done = new Set<string>()
	/** Rejections waiting to be marked: off-page, or backed off because the user was busy */
	private readonly pending = new Set<string>()

	private readonly observer = new MutationObserver(() => this.schedule())
	private readonly unwatchers: (() => void)[] = []

	constructor(adapter: MailAdapter) {
		this.adapter = adapter
		this.logPrefix = `[DidNotGetIt:${adapter.platform}]`
	}

	async start() {
		this.isPaused = await isPausedItem.getValue()
		this.isAutoRead = await isAutoReadItem.getValue()
		this.labelName = await rejectionTagItem.getValue()

		this.unwatchers.push(
			rejectionTagItem.watch((name) => (this.labelName = name)),
			isAutoReadItem.watch((autoRead) => (this.isAutoRead = autoRead)),
			isPausedItem.watch((paused) => this.onPausedChange(paused))
		)
		this.observer.observe(document.body, { childList: true, subtree: true })

		this.schedule()
	}

	stop() {
		this.isPaused = true

		this.observer.disconnect()
		this.unwatchers.forEach((unwatch) => unwatch())

		clearTimeout(this.timer)
	}

	private onPausedChange(paused: boolean) {
		this.isPaused = paused

		if (paused) return

		// Resume is a fresh start: everything gets re-checked, earlier failures included.
		this.done.clear()
		this.pending.clear()
		this.schedule(0)
	}

	private schedule(delay = SCAN_THROTTLE_MILLIS) {
		if (this.timer !== undefined) return

		this.timer = setTimeout(() => {
			this.timer = undefined
			void this.scan()
		}, delay)
	}

	private async scan() {
		if (this.isPaused || this.isScanning) return

		this.isScanning = true

		try {
			await this.classifyNewCandidates()
			await this.markPending()
		} catch (err) {
			console.error(`${this.logPrefix} Scan failed:`, err)
		} finally {
			this.isScanning = false
		}
	}

	private async classifyNewCandidates() {
		for (const candidate of this.adapter.getCandidates(this.labelName)) {
			if (this.isPaused) return

			const { id, subject } = candidate

			if (this.done.has(id) || this.pending.has(id)) continue

			try {
				if (await isRejection(this.adapter, candidate)) {
					console.log(`${this.logPrefix} Rejection detected: "${subject}"`)
					this.pending.add(id)
				} else {
					this.done.add(id)
				}
			} catch (err) {
				console.error(`${this.logPrefix} Could not classify "${subject}":`, err)
				this.done.add(id)
			}
		}
	}

	private async markPending() {
		if (this.pending.size === 0 || this.isPaused) return

		const ids = [...this.pending]

		try {
			const marked = await this.adapter.markAsRejection(ids, this.labelName, this.isAutoRead)

			this.moveToDone(marked)

			if (marked.length > 0) await incrementRejectionCount(marked.length)
		} catch (err) {
			console.error(
				`${this.logPrefix} Failed to mark ${ids.length} rejection(s), skipping until resume:`,
				err
			)
			this.moveToDone(ids)
		}

		// The adapter backed off for the user, or rows are off-page: try again later.
		if (this.pending.size > 0) this.schedule(RETRY_MILLIS)
	}

	private moveToDone(ids: string[]) {
		for (const id of ids) {
			this.pending.delete(id)
			this.done.add(id)
		}
	}
}
