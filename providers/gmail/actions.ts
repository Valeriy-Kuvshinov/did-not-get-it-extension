import { sleep, waitFor } from "@/shared/utils"

import {
	clickAndWait,
	findVisible,
	isVisible,
	queryAll,
	realClick,
	typeInto,
	unhover,
} from "../dom"

import { findRow, getCheckbox, isChecked } from "./page"

import { GMAIL_DOM } from "./selectors"

/** Time for a lingering "Label as" menu to show up after the label click */
const MENU_SETTLE_MILLIS = 400
const MENU_TOGGLE_MILLIS = 200

/** A new label takes a round trip to Gmail's servers before the sidebar lists it */
const LABEL_CREATE_TIMEOUT_MILLIS = 5000

/** Gmail refuses to color a label it's still saving, so a new label gets this long first */
const NEW_LABEL_SETTLE_MILLIS = 2000

/** New label colors, written the way Gmail titles its swatches */
const LABEL_BG_COLOR = "RGB (130, 33, 17)"
const LABEL_TEXT_COLOR = "RGB (255, 255, 255)"

function findInToolbar(selector: string): HTMLElement | null {
	const toolbar = findVisible(GMAIL_DOM.toolbar)

	return toolbar ? findVisible(selector, toolbar) : null
}

/** Advanced toolbar has a Labels button; the simple one hides labels under More → Label as ► */
function findLabelEntryButton(): HTMLElement | null {
	return findInToolbar(GMAIL_DOM.labelsBtn) ?? findInToolbar(GMAIL_DOM.moreBtn)
}

function findLabelItem(labelName: string): HTMLElement | null {
	return (
		queryAll(GMAIL_DOM.labelItem).find((el) => el.title === labelName && isVisible(el)) ?? null
	)
}

/** Exact match on data-label-name, which also covers names with quotes or emoji */
function findSidebarLabel(labelName: string): HTMLElement | null {
	return (
		queryAll(GMAIL_DOM.sidebarLabelBtn).find((el) => el.dataset.labelName === labelName) ?? null
	)
}

/** The custom color dialog lists every swatch twice: background palette first, text palette second */
function findSwatches(dialog: HTMLElement, title: string): HTMLElement[] {
	return queryAll(GMAIL_DOM.colorSwatch, dialog).filter((el) => el.title === title)
}

/** Gmail marks the swatch's cell as selected, not the swatch itself */
function isSwatchPicked(swatch: HTMLElement): boolean {
	return swatch.parentElement?.getAttribute("aria-selected") === "true"
}

/** A collapsed sidebar peeks open while hovered; the "sliding" class is only there mid-animation */
function hasSlidOpen(sidebar: HTMLElement): boolean {
	return (
		sidebar.classList.contains(GMAIL_DOM.sidebarSlidOpenClass) &&
		!sidebar.classList.contains(GMAIL_DOM.sidebarSlidingClass)
	)
}

function isAnyMenuOpen(): boolean {
	return !!findVisible(GMAIL_DOM.menu)
}

/** Synthetic clicks leave toolbar controls in their hover look, so drop it right away */
function clickAndUnhover(el: HTMLElement) {
	realClick(el)
	unhover(el)
}

/** A dialog left open blocks the whole page */
function cancelDialog(dialog: HTMLElement) {
	const cancelBtn = dialog.querySelector<HTMLElement>(GMAIL_DOM.dialogCancelBtn)

	if (cancelBtn && isVisible(cancelBtn)) realClick(cancelBtn)
}

/** More → Label as ► (or Labels). Returns the button that opened it */
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

/** Label as ► Create new → type the name → Create. Done once the sidebar lists the label */
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
		cancelDialog(dialog) // e.g. Gmail refused the name
		throw err
	}
}

/** Picks the background and text colors in the "Add custom color" dialog, then Apply */
async function applyCustomColor(dialog: HTMLElement) {
	try {
		const [bgSwatch] = findSwatches(dialog, LABEL_BG_COLOR)
		const [, textSwatch] = findSwatches(dialog, LABEL_TEXT_COLOR)
		const applyBtn = dialog.querySelector<HTMLElement>(GMAIL_DOM.dialogOkBtn)

		if (!bgSwatch || !textSwatch || !applyBtn) {
			throw new Error('[Gmail] The "Add custom color" dialog has changed')
		}
		await clickAndWait(bgSwatch, () => isSwatchPicked(bgSwatch), "the background color")
		await clickAndWait(textSwatch, () => isSwatchPicked(textSwatch), "the text color")
		await clickAndWait(
			applyBtn,
			() => !isVisible(dialog),
			'the "Add custom color" dialog to close'
		)
	} catch (err) {
		cancelDialog(dialog)
		throw err
	}
}

/** Sidebar label ▼ → Label color ► → Add custom color → background + text → Apply */
async function colorLabel(labelName: string) {
	// Found again rather than kept from creation: the sidebar may re-render in between
	const optionsBtn = await waitFor(
		() => findSidebarLabel(labelName),
		`"${labelName}" in the sidebar`
	)
	// A collapsed sidebar ignores clicks on its labels until it slides open, which Gmail does on mouseenter
	const sidebar = optionsBtn.closest<HTMLElement>(GMAIL_DOM.sidebar)
	const collapsedSidebar = sidebar?.classList.contains(GMAIL_DOM.sidebarCollapsedClass)
		? sidebar
		: null

	try {
		if (collapsedSidebar) {
			collapsedSidebar.dispatchEvent(new MouseEvent("mouseenter"))
			await waitFor(
				() => hasSlidOpen(collapsedSidebar),
				"the collapsed sidebar to slide open"
			)
		}
		realClick(optionsBtn)

		const labelColor = await waitFor(
			() => findVisible(GMAIL_DOM.submenuItem),
			'"Label color" in the label menu'
		)
		realClick(labelColor) // no unhover here: leaving "Label color" closes its submenu

		const addCustomColor = await waitFor(
			() => findVisible(GMAIL_DOM.addCustomColorItem),
			'"Add custom color" in the Label color menu'
		)
		realClick(addCustomColor)

		const dialog = await waitFor(
			() => findVisible(GMAIL_DOM.dialog),
			'the "Add custom color" dialog'
		)
		await applyCustomColor(dialog)
	} finally {
		// The click's mouseover also brings up Gmail's tooltip with the full label name
		unhover(optionsBtn)

		if (collapsedSidebar) collapsedSidebar.dispatchEvent(new MouseEvent("mouseleave"))
	}
}

export function selectRow(id: string, row: HTMLTableRowElement) {
	return clickAndWait(
		getCheckbox(row),
		() => isChecked(findRow(id) ?? row),
		`thread ${id} to get selected`
	)
}

/**
 * More → Label as ► → label (or Labels → label), then closes the menu.
 * Returns true when the label had to be created first, so the caller can color it later.
 */
export async function applyLabel(labelName: string): Promise<boolean> {
	const entryBtn = await openLabelMenu()
	const item = findLabelItem(labelName)

	if (!item) await createLabel(labelName)
	else if (item.getAttribute("aria-checked") !== "true") {
		realClick(item) // ticked already means every selected row has it, and a click would remove it
	}
	unhover(entryBtn)

	await closeLeftoverMenus()

	return !item
}

/** Colors a label applyLabel just created. An uncolored label still works, so failures only warn */
export async function colorNewLabel(labelName: string) {
	await sleep(NEW_LABEL_SETTLE_MILLIS)

	try {
		await colorLabel(labelName)
	} catch (err) {
		console.warn("[Gmail] Created the label, but couldn't color it:", err)
	}
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
 * Clicking a label should close the menu, but it can linger or pop back up a moment later.
 * Toggling the button that opened it closes it; a second toggle covers the first one reopening More.
 * Run it while rows are still selected: the Labels button only exists then.
 */
export async function closeLeftoverMenus() {
	await sleep(MENU_SETTLE_MILLIS)

	for (let toggles = 0; toggles < 2 && isAnyMenuOpen(); toggles++) {
		const entryBtn = findLabelEntryButton()

		if (!entryBtn) break

		clickAndUnhover(entryBtn)

		await sleep(MENU_TOGGLE_MILLIS)
	}
	if (isAnyMenuOpen()) console.warn("[Gmail] A menu stayed open after toggling its button")
}
