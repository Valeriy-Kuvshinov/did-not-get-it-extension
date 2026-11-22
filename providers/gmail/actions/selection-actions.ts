import { clickAndWait, realClick, unhover } from "@/providers/dom"

import { findInToolbar, findRow, isChecked } from "../page"
import { GMAIL_DOM } from "../selectors"

function getCheckbox(row: Element): HTMLElement {
	const box = row.querySelector<HTMLElement>(GMAIL_DOM.rowCheckbox)

	if (!box) throw new Error("[Gmail] Row checkbox not found")

	return box
}

export function selectRow(id: string, row: HTMLTableRowElement) {
	return clickAndWait(
		getCheckbox(row),
		() => isChecked(findRow(id) ?? row),
		`thread ${id} to get selected`
	)
}

export function markSelectionAsRead() {
	const btn = findInToolbar(GMAIL_DOM.markAsReadBtn)

	if (!btn) return // absent when nothing selected is unread

	realClick(btn)
	unhover(btn)
}

/** One click on the toolbar's Select checkbox clears the whole selection */
export function deselectAll() {
	const box = findInToolbar(GMAIL_DOM.selectAllCheckbox)

	// "false" means nothing is selected, and a click would select every row instead
	if (!box || box.getAttribute("aria-checked") === "false") return

	realClick(box)
	unhover(box)
}

/** Unchecks only the given rows, leaving any the user checked alone */
export function deselectRows(ids: string[]) {
	for (const id of ids) {
		const row = findRow(id)

		if (row && isChecked(row)) realClick(getCheckbox(row))
	}
}
