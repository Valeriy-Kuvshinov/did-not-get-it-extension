import { findVisible, isVisible, queryAll, userInputSince } from "../dom"

import { GMAIL_DOM } from "./selectors"

const INPUTS = ["INPUT", "TEXTAREA", "SELECT"]
const USER_QUIET_MS = 3000
/** Open drafts show up in the hash: #inbox?compose=new, or ?compose=<draft id> */
const COMPOSE_HASH_PARAM = "compose="

export function visibleRows(): HTMLTableRowElement[] {
	return queryAll<HTMLTableRowElement>(GMAIL_DOM.row).filter(isVisible)
}

export function getThreadId(row: Element): string | null {
	return row.querySelector(GMAIL_DOM.threadId)?.getAttribute(GMAIL_DOM.threadIdAttr) ?? null
}

export function findRow(threadId: string): HTMLTableRowElement | null {
	return visibleRows().find((row) => getThreadId(row) === threadId) ?? null
}

export function getCheckbox(row: Element): HTMLElement {
	const box = row.querySelector<HTMLElement>(GMAIL_DOM.rowCheckbox)

	if (!box) throw new Error("[Gmail] Row checkbox not found")

	return box
}

export function getToolbar(): HTMLElement {
	const toolbar = findVisible(GMAIL_DOM.toolbar)

	if (!toolbar) throw new Error("[Gmail] Main toolbar not visible")

	return toolbar
}

export function isChecked(row: Element): boolean {
	return row.querySelector(GMAIL_DOM.rowCheckbox)?.getAttribute("aria-checked") === "true"
}

export function isUnread(row: Element): boolean {
	return row.classList.contains(GMAIL_DOM.unreadRowClass)
}

export function hasLabel(row: Element, labelName: string): boolean {
	return queryAll(GMAIL_DOM.labelChip, row).some(
		(chip) => chip.getAttribute("title") === labelName
	)
}

/** Labeled, and also read (if user wants rejections marked as read) */
export function isDone(row: Element | null, labelName: string, markAsRead: boolean): boolean {
	return !!row && hasLabel(row, labelName) && (!markAsRead || !isUnread(row))
}

export function textOf(row: Element, selector: string): string {
	return row.querySelector(selector)?.textContent?.trim() ?? ""
}

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

/** False while the user is or was just active, or the list isn't in a state we can safely act on */
export function isIdle(): boolean {
	const rows = visibleRows()

	return (
		!document.hidden &&
		!userInputSince(performance.now() - USER_QUIET_MS) &&
		!isTyping() &&
		!isComposeOpen() &&
		rows.length > 0 &&
		!rows.some(isChecked) &&
		!findVisible(GMAIL_DOM.menu) &&
		!!findVisible(GMAIL_DOM.toolbar)
	)
}
