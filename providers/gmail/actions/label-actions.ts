import { sleep, waitFor } from "@/shared/utils"

import { queryAll, isVisible, findVisible, realClick, typeInto, unhover } from "@/providers/dom"

import { findInToolbar, findSidebarLabel, cancelDialog, isAnyMenuOpen, isSameLabel } from "../page"
import { GMAIL_DOM } from "../selectors"

/** Time for a lingering "Label as" menu to show up after the label click */
const MENU_SETTLE_MILLIS = 400
const MENU_TOGGLE_MILLIS = 200

/** A new label takes a round trip to Gmail's servers before the sidebar lists it */
const LABEL_CREATE_TIMEOUT_MILLIS = 1000 * 5

/** Advanced toolbar has a Labels button.
    Simple toolbar hides labels under More --> Label as 
*/
function findLabelEntryButton(): HTMLElement | null {
	return findInToolbar(GMAIL_DOM.labelsBtn) ?? findInToolbar(GMAIL_DOM.moreBtn)
}

function findLabelItem(labelName: string): HTMLElement | null {
	return (
		queryAll(GMAIL_DOM.labelItem).find(
			(el) => isSameLabel(el.title, labelName) && isVisible(el)
		) ?? null
	)
}

/** More --> Label as --> (or Labels). Return the button that opened it */
async function openLabelMenu(): Promise<HTMLElement> {
	const entryBtn = await waitFor(findLabelEntryButton, "the Labels or More button")

	realClick(entryBtn)

	if (entryBtn.matches(GMAIL_DOM.moreBtn)) {
		const labelAs = await waitFor(
			() => findVisible(GMAIL_DOM.submenuItem),
			'"Label as" in the More menu'
		)
		realClick(labelAs) // no unhover here: leaving "Label as" closes its submenu
	}
	await waitFor(() => findVisible(GMAIL_DOM.createLabelItem), "the Label-as menu")

	return entryBtn
}

/** Label as --> Create new --> type name --> Create. 
    Done once the sidebar lists the label 
*/
async function createLabel(labelName: string) {
	const createItem = await waitFor(
		() => findVisible(GMAIL_DOM.createLabelItem),
		'"Create new" in the Label-as menu'
	)
	realClick(createItem)

	const dialog = await waitFor(() => findVisible(GMAIL_DOM.dialog), 'the "New label" dialog')

	try {
		const input = dialog.querySelector<HTMLInputElement>(GMAIL_DOM.dialogInput)
		const createBtn = dialog.querySelector<HTMLButtonElement>(GMAIL_DOM.dialogOkBtn)

		if (!input || !createBtn) throw new Error('[Gmail] The "New label" dialog has changed')

		typeInto(input, labelName)

		// Create stays disabled until Gmail has seen a name
		await waitFor(() => !createBtn.disabled, "the Create button to enable")
		realClick(createBtn)

		await waitFor(
			() => findSidebarLabel(labelName),
			`"${labelName}" to show up in the sidebar`,
			LABEL_CREATE_TIMEOUT_MILLIS
		)
	} catch (err) {
		cancelDialog(dialog)
		throw err
	}
}

/**
 * More --> Label as --> label (or Labels --> label) --> close the menu.
 * Returns true when the label had to be created first, so the caller can color it later.
 */
export async function applyLabel(labelName: string): Promise<boolean> {
	const entryBtn = await openLabelMenu()
	const item = findLabelItem(labelName)

	if (!item) await createLabel(labelName)
	// ticked already means every selected row has it, and a click would remove it
	else if (item.getAttribute("aria-checked") !== "true") realClick(item)

	unhover(entryBtn)

	await closeLeftoverMenus()

	return !item
}

/**
 * Clicking a label should close the menu, but it can linger or pop back up a moment later.
 * Toggling the button that opened it closes it; a second toggle covers the first one reopening More.
 * Run it while rows are still selected: the Labels button only exists then.
 */
export async function closeLeftoverMenus() {
	await sleep(MENU_SETTLE_MILLIS)

	for (let toggles = 0; toggles < 2 && isAnyMenuOpen(); toggles++) {
		const entryBtn = findLabelEntryButton()

		if (!entryBtn) break

		realClick(entryBtn)
		unhover(entryBtn)

		await sleep(MENU_TOGGLE_MILLIS)
	}
	if (isAnyMenuOpen()) console.warn("[Gmail] A menu stayed open after toggling its button")
}
