import type { MailAdapter, MailCandidate } from "@/interfaces/mail"

import { sleep, userInputSince, waitFor } from "../dom"
import {
	applyLabelToSelection,
	closeMenus,
	deselect,
	markSelectionAsRead,
	selectRow,
} from "./actions"

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

import { GMAIL_DOM } from "./selectors"

const UI_SETTLE_MS = 150
const VERIFY_TIMEOUT_MS = 5000

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

async function markAsRejection(ids: string[], labelName: string): Promise<string[]> {
	if (!isIdle()) return [] // the user is busy; try later

	const startedAt = performance.now()
	const previousFocus = document.activeElement
	const alreadyDone = ids.filter((id) => isDone(findRow(id), labelName))
	const selected: string[] = []

	try {
		for (const id of ids) {
			if (userInputSince(startedAt)) return alreadyDone // accept's user interactions

			const row = findRow(id)

			if (!row || alreadyDone.includes(id)) continue // off-page rows stay pending

			selected.push(id)
			await selectRow(id, row)
		}
		if (selected.length === 0) return alreadyDone

		await sleep(UI_SETTLE_MS)

		// Last point to back off
		if (userInputSince(startedAt)) return alreadyDone

		await applyLabelToSelection(labelName)

		await sleep(UI_SETTLE_MS)
		markSelectionAsRead()

		await waitFor(
			() => selected.every((id) => isDone(findRow(id), labelName)),
			`"${labelName}" + read state on ${selected.length} row(s)`,
			VERIFY_TIMEOUT_MS
		)

		return [...alreadyDone, ...selected]
	} finally {
		await closeMenus().catch((err) => console.warn("[Gmail] Could not close menus:", err))

		deselect(selected)

		if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true })
	}
}

export const gmailAdapter: MailAdapter = {
	platform: "gmail",
	getCandidates,
	fetchBody,
	markAsRejection,
}
