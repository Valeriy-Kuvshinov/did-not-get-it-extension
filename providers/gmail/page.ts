import { findVisible, isVisible, queryAll, realClick } from "../dom"

import { GMAIL_DOM } from "./selectors"

export function findInToolbar(selector: string): HTMLElement | null {
	const toolbar = findVisible(GMAIL_DOM.toolbar)

	return toolbar ? findVisible(selector, toolbar) : null
}

/** A dialog left open blocks the whole page */
export function cancelDialog(dialog: HTMLElement) {
	const cancelBtn = dialog.querySelector<HTMLElement>(GMAIL_DOM.dialogCancelBtn)

	if (cancelBtn && isVisible(cancelBtn)) realClick(cancelBtn)
}

/** Exact match on data-label-name, which also covers names with quotes or emoji */
export function findSidebarLabel(labelName: string): HTMLElement | null {
	return (
		queryAll(GMAIL_DOM.sidebarLabelBtn).find((el) => el.dataset.labelName === labelName) ?? null
	)
}

/** Gmail treats names that differ only in letter case as the same label */
export function isSameLabel(a: string, b: string): boolean {
	return a.toLowerCase() === b.toLowerCase()
}

export function getVisibleRows(): HTMLTableRowElement[] {
	return queryAll<HTMLTableRowElement>(GMAIL_DOM.row).filter(isVisible)
}

export function getThreadId(row: Element): string | null {
	return row.querySelector(GMAIL_DOM.threadId)?.getAttribute(GMAIL_DOM.threadIdAttr) ?? null
}

export function findRow(threadId: string): HTMLTableRowElement | null {
	return getVisibleRows().find((row) => getThreadId(row) === threadId) ?? null
}

export function isChecked(row: Element): boolean {
	return row.querySelector(GMAIL_DOM.rowCheckbox)?.getAttribute("aria-checked") === "true"
}

export function isUnread(row: Element): boolean {
	return row.classList.contains(GMAIL_DOM.unreadRowClass)
}

export function hasLabel(row: Element, labelName: string): boolean {
	return queryAll(GMAIL_DOM.labelChip, row).some((chip) => isSameLabel(chip.title, labelName))
}

/** Labeled, and also read (if user wants rejections marked as read) */
export function isDone(row: Element | null, labelName: string, markAsRead: boolean): boolean {
	return !!row && hasLabel(row, labelName) && (!markAsRead || !isUnread(row))
}

export function textOf(row: Element, selector: string): string {
	return row.querySelector(selector)?.textContent?.trim() ?? ""
}

export function isAnyMenuOpen(): boolean {
	return !!findVisible(GMAIL_DOM.menu)
}

/** A collapsed sidebar peeks open while hovered; the "sliding" class is only there mid-animation */
export function hasSlidOpen(sidebar: HTMLElement): boolean {
	return (
		sidebar.classList.contains(GMAIL_DOM.sidebarSlidOpenClass) &&
		!sidebar.classList.contains(GMAIL_DOM.sidebarSlidingClass)
	)
}
