import "./stealth.css"

import type { MailAdapter, MailCandidate } from "@/shared/interfaces/mail"

import { sleep, waitFor } from "@/shared/utils"

import { findVisible, userInputSince } from "../dom"

import { fetchBody } from "./fetch-body"
import {
	findRow,
	getThreadId,
	hasLabel,
	isDone,
	isUnread,
	textOf,
	getVisibleRows,
	isChecked,
	isAnyMenuOpen,
} from "./page"
import { GMAIL_DOM } from "./selectors"
import {
	selectRow,
	markSelectionAsRead,
	deselectRows,
	deselectAll,
} from "./actions/selection-actions"
import { applyLabel, closeLeftoverMenus } from "./actions/label-actions"
import { colorLabel } from "./actions/label-color-actions"

const UI_SETTLE_MILLIS = 150
const VERIFY_TIMEOUT_MILLIS = 1000 * 5

const WORKING_CLASS = "did-not-get-it-hide"

const INPUTS = ["INPUT", "TEXTAREA", "SELECT"]

const USER_IDLE_MILLIS = 1000 * 3

const COMPOSE_HASH_PARAM = "compose="

function isTyping(): boolean {
	const active = document.activeElement

	return (
		active instanceof HTMLElement &&
		(active.isContentEditable || INPUTS.includes(active.tagName))
	)
}

function isComposeOpen(): boolean {
	return location.hash.includes(COMPOSE_HASH_PARAM)
}

function isUserIdle(): boolean {
	const rows = getVisibleRows()

	return (
		!document.hidden &&
		!userInputSince(performance.now() - USER_IDLE_MILLIS) &&
		!isTyping() &&
		!isComposeOpen() &&
		rows.length > 0 &&
		!rows.some(isChecked) &&
		!isAnyMenuOpen() &&
		!!findVisible(GMAIL_DOM.toolbar)
	)
}

function getCandidates(labelName: string): MailCandidate[] {
	const candidates: MailCandidate[] = []

	for (const row of getVisibleRows()) {
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
	if (!isUserIdle()) return [] // the user is busy; try later

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

		await sleep(UI_SETTLE_MILLIS)

		if (userInputSince(startedAt)) return alreadyDone // last point to back off

		const createdLabel = await applyLabel(labelName)

		if (markAsRead) {
			await sleep(UI_SETTLE_MILLIS)
			markSelectionAsRead()
		}
		await waitFor(
			() => selected.every((id) => isDone(findRow(id), labelName, markAsRead)),
			`"${labelName}"${markAsRead ? " + read state" : ""} on ${selected.length} row(s)`,
			VERIFY_TIMEOUT_MILLIS
		)

		if (createdLabel) await colorLabel(labelName)

		return [...alreadyDone, ...selected]
	} finally {
		await closeLeftoverMenus()

		// If the user touched the page meanwhile, they may have checked rows of their own
		if (userInputSince(startedAt)) deselectRows(selected)
		else deselectAll()

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
