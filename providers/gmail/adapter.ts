import "./stealth.css"

import type { MailAdapter, MailCandidate } from "@/interfaces/mail"

import { sleep, userInputSince, waitFor } from "../dom"
import { fetchBody } from "./fetch-body"
import {
	findRow,
	getThreadId,
	hasLabel,
	isDone,
	isIdle,
	isUnread,
	textOf,
	visibleRows,
} from "./page"
import {
	selectRow,
	applyLabel,
	markSelectionAsRead,
	deselectRows,
	deselectAll,
	closeLeftoverMenus,
} from "./actions"
import { GMAIL_DOM } from "./selectors"

const UI_SETTLE_MS = 150
const VERIFY_TIMEOUT_MS = 5000

const WORKING_CLASS = "did-not-get-it-hide"

function getCandidates(labelName: string): MailCandidate[] {
	const candidates: MailCandidate[] = []

	for (const row of visibleRows()) {
		if (!isUnread(row) || hasLabel(row, labelName)) continue

		const id = getThreadId(row)

		if (!id) continue

		candidates.push({
			id,
			subject: textOf(row, GMAIL_DOM.subject),
			snippet: textOf(row, GMAIL_DOM.snippet),
		})
	}
	return candidates
}

async function markAsRejection(
	ids: string[],
	labelName: string,
	markAsRead: boolean
): Promise<string[]> {
	if (!isIdle()) return [] // the user is busy; try later

	const startedAt = performance.now()
	const previousFocus = document.activeElement

	const alreadyDone = ids.filter((id) => isDone(findRow(id), labelName, markAsRead))
	const selected: string[] = []

	document.documentElement.classList.add(WORKING_CLASS)

	try {
		for (const id of ids) {
			if (userInputSince(startedAt)) return alreadyDone // the user is back: leave the page to them

			const row = findRow(id)

			if (!row || alreadyDone.includes(id)) continue // off-page rows stay pending

			selected.push(id)
			await selectRow(id, row)
		}
		if (selected.length === 0) return alreadyDone

		await sleep(UI_SETTLE_MS)

		if (userInputSince(startedAt)) return alreadyDone // last point to back off

		await applyLabel(labelName)

		if (markAsRead) {
			await sleep(UI_SETTLE_MS)
			markSelectionAsRead()
		}
		await waitFor(
			() => selected.every((id) => isDone(findRow(id), labelName, markAsRead)),
			`"${labelName}"${markAsRead ? " + read state" : ""} on ${selected.length} row(s)`,
			VERIFY_TIMEOUT_MS
		)
		return [...alreadyDone, ...selected]
	} finally {
		// If the user touched the page meanwhile, they may have checked rows of their own
		if (userInputSince(startedAt)) deselectRows(selected)
		else deselectAll()

		await closeLeftoverMenus().catch((err) =>
			console.warn("[Gmail] Could not close menus:", err)
		)

		if (previousFocus instanceof HTMLElement && document.activeElement !== previousFocus) {
			previousFocus.focus({ preventScroll: true })
		}
		document.documentElement.classList.remove(WORKING_CLASS)
	}
}

export const gmailAdapter: MailAdapter = {
	platform: "gmail",
	getCandidates,
	fetchBody,
	markAsRejection,
}
