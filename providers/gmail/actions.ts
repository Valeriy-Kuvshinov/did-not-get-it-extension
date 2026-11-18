import { clickAndWait, findVisible, queryAll, realClick, sleep, unhover, waitFor } from "../dom"

import { findRow, getCheckbox, getToolbar, isChecked } from "./page"

import { GMAIL_DOM } from "./selectors"

const MENU_TOGGLE_MS = 200

function findLabelMenu(): HTMLElement | null {
	return findVisible(GMAIL_DOM.labelItem)?.closest<HTMLElement>(GMAIL_DOM.menu) ?? null
}

function allMenusClosed(): boolean {
	return !findVisible(GMAIL_DOM.menu)
}

/** Checks every visible toolbar, since Gmail can render more than one. */
function findLabelEntryButton(): HTMLElement | null {
	const toolbar = findVisible(GMAIL_DOM.toolbar)

	if (!toolbar) return null

	return findVisible(GMAIL_DOM.labelsBtn, toolbar) ?? findVisible(GMAIL_DOM.moreBtn, toolbar)
}

/** Advanced toolbar has a Labels button; the simple one hides it under More → Label as ►. */
async function openLabelMenu(): Promise<HTMLElement> {
	const entryBtn = await waitFor(findLabelEntryButton, "the Labels or More toolbar button")

	if (entryBtn.matches(GMAIL_DOM.labelsBtn)) {
		return clickAndWait(entryBtn, findLabelMenu, "the Label-as menu")
	}
	const labelAs = await clickAndWait(
		entryBtn,
		() => findVisible(`${GMAIL_DOM.menu} ${GMAIL_DOM.labelAsSubmenu}`),
		'"Label as" in the More menu'
	)
	return clickAndWait(labelAs, findLabelMenu, "the Label-as menu")
}

export async function applyLabelToSelection(labelName: string) {
	const menu = await openLabelMenu()

	const item = queryAll(GMAIL_DOM.labelItem, menu).find(
		(el) => el.getAttribute("title") === labelName
	)

	if (!item) {
		throw new Error(`[Gmail] Label "${labelName}" doesn't exist. Create it in Gmail once.`)
	}
	if (item.getAttribute("aria-checked") !== "true") {
		await clickAndWait(
			item,
			() => item.getAttribute("aria-checked") === "true",
			`"${labelName}" to get checked`
		)

		const applyBtn = findVisible(GMAIL_DOM.applyBtn, menu)

		if (applyBtn) realClick(applyBtn)
	}
	await closeMenus()
}

/**
 * Ticking a label leaves "Label as" open and outside clicks / Escape don't close it.
 * Toggling the button that opened it (More, or Labels on the advanced toolbar) does.
 * A second click covers the case where the first one reopened More instead.
 */
export async function closeMenus() {
	for (let attempt = 0; attempt < 2 && !allMenusClosed(); attempt++) {
		const toggleBtn = findLabelEntryButton()

		if (!toggleBtn) break

		realClick(toggleBtn)
		unhover(toggleBtn)

		await sleep(MENU_TOGGLE_MS)
	}
	if (!allMenusClosed()) throw new Error("[Gmail] Menus stayed open after toggling More")
}

export function markSelectionAsRead() {
	const btn = findVisible(GMAIL_DOM.markAsReadBtn, getToolbar())

	if (btn) realClick(btn) // absent when nothing selected is unread
}

export function selectRow(id: string, row: HTMLTableRowElement) {
	return clickAndWait(
		getCheckbox(row),
		() => isChecked(findRow(id) ?? row),
		`thread ${id} to get selected`
	)
}

export function deselect(ids: string[]) {
	for (const id of ids) {
		const row = findRow(id)

		if (row && isChecked(row)) realClick(getCheckbox(row))
	}
}
