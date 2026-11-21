import {
	clickAndWait,
	findVisible,
	isVisible,
	queryAll,
	realClick,
	sleep,
	unhover,
	waitFor,
} from "../dom"

import { findRow, getCheckbox, isChecked } from "./page"

import { GMAIL_DOM } from "./selectors"

/** Time for a lingering "Label as" menu to show up after the label click */
const MENU_SETTLE_MS = 400
const MENU_TOGGLE_MS = 200

function findInToolbar(selector: string): HTMLElement | null {
	const toolbar = findVisible(GMAIL_DOM.toolbar)

	return toolbar ? findVisible(selector, toolbar) : null
}

/** Advanced toolbar has a Labels button; the simple one hides labels under More → Label as ► */
function findLabelEntryButton(): HTMLElement | null {
	return findInToolbar(GMAIL_DOM.labelsBtn) ?? findInToolbar(GMAIL_DOM.moreBtn)
}

function isAnyMenuOpen(): boolean {
	return !!findVisible(GMAIL_DOM.menu)
}

/** Synthetic clicks leave toolbar controls in their hover look, so drop it right away */
function clickAndUnhover(el: HTMLElement) {
	realClick(el)
	unhover(el)
}

export function selectRow(id: string, row: HTMLTableRowElement) {
	return clickAndWait(
		getCheckbox(row),
		() => isChecked(findRow(id) ?? row),
		`thread ${id} to get selected`
	)
}

/** More → Label as ► → label (or Labels → label). Clicking the label applies it to the selection */
export async function applyLabel(labelName: string) {
	const entryBtn = await waitFor(findLabelEntryButton, "the Labels or More button")

	realClick(entryBtn)

	if (entryBtn.matches(GMAIL_DOM.moreBtn)) {
		const labelAs = await waitFor(
			() => findVisible(GMAIL_DOM.labelAsSubmenu),
			'"Label as" in the More menu'
		)
		realClick(labelAs) // no unhover here: leaving "Label as" closes its submenu
	}
	await waitFor(() => findVisible(GMAIL_DOM.labelItem), "the Label-as menu")

	const item = queryAll(GMAIL_DOM.labelItem).find((el) => el.title === labelName && isVisible(el))

	if (!item) {
		throw new Error(`[Gmail] Label "${labelName}" doesn't exist. Create it in Gmail once.`)
	}
	// Already ticked means every selected row has it, and a click would remove it
	if (item.getAttribute("aria-checked") !== "true") realClick(item)

	unhover(entryBtn)
}

export function markSelectionAsRead() {
	const btn = findInToolbar(GMAIL_DOM.markAsReadBtn)

	if (btn) clickAndUnhover(btn) // absent when nothing selected is unread
}

/** One click on the toolbar's Select checkbox clears the whole selection */
export function deselectAll() {
	const box = findInToolbar(GMAIL_DOM.selectAllCheckbox)

	// "false" means nothing is selected, and a click would select every row instead
	if (box && box.getAttribute("aria-checked") !== "false") clickAndUnhover(box)
}

/** Unchecks only the given rows, leaving any the user checked alone */
export function deselectRows(ids: string[]) {
	for (const id of ids) {
		const row = findRow(id)

		if (row && isChecked(row)) realClick(getCheckbox(row))
	}
}

/**
 * Clicking a label should close both menus, but "Label as" can linger or pop back up a moment later.
 * Toggling the button that opened it closes it; a second toggle covers the first one reopening More.
 */
export async function closeLeftoverMenus() {
	await sleep(MENU_SETTLE_MS)

	for (let toggles = 0; toggles < 2 && isAnyMenuOpen(); toggles++) {
		const entryBtn = findLabelEntryButton()

		if (!entryBtn) break

		clickAndUnhover(entryBtn)

		await sleep(MENU_TOGGLE_MS)
	}
	if (isAnyMenuOpen()) throw new Error("[Gmail] A menu stayed open after toggling More")
}
