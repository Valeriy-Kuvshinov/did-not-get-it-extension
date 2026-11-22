import { sleep, waitFor } from "@/shared/utils"

import { clickAndWait, findVisible, isVisible, queryAll, unhover } from "@/providers/dom"

import { cancelDialog, findSidebarLabel, hasSlidOpen } from "../page"
import { GMAIL_DOM } from "../selectors"

const NEW_LABEL_WAIT_MILLIS = 1000 * 2

const LABEL_BG_COLOR = "RGB (130, 33, 17)"
const LABEL_TEXT_COLOR = "RGB (255, 255, 255)"

/** The custom color dialog lists has a background palette and a text palette */
function findSwatches(dialog: HTMLElement, title: string): HTMLElement[] {
	return queryAll(GMAIL_DOM.colorSwatch, dialog).filter((el) => el.title === title)
}

/** Gmail marks the swatch's cell as selected, not the swatch itself */
function isSwatchPicked(swatch: HTMLElement): boolean {
	return swatch.parentElement?.getAttribute("aria-selected") === "true"
}

/** A collapsed sidebar ignores clicks on its labels until it slides open */
function findCollapsedSidebar(labelBtn: HTMLElement): HTMLElement | null {
	const sidebar = labelBtn.closest<HTMLElement>(GMAIL_DOM.sidebar)

	return sidebar?.classList.contains(GMAIL_DOM.sidebarCollapsedClass) ? sidebar : null
}

/** Gmail slides a collapsed sidebar open on mouseenter, and closes it again on mouseleave */
async function slideOpen(sidebar: HTMLElement) {
	sidebar.dispatchEvent(new MouseEvent("mouseenter"))

	await waitFor(() => hasSlidOpen(sidebar), "the collapsed sidebar to slide open")
}

/** Sidebar label --> Label color --> Add custom color. Returns the dialog */
async function openCustomColorDialog(labelBtn: HTMLElement): Promise<HTMLElement> {
	const labelColor = await clickAndWait(
		labelBtn,
		() => findVisible(GMAIL_DOM.submenuItem),
		'"Label color" in the label menu'
	)
	const addCustomColor = await clickAndWait(
		labelColor,
		() => findVisible(GMAIL_DOM.addCustomColorItem),
		'"Add custom color" in the Label color menu'
	)
	return clickAndWait(
		addCustomColor,
		() => findVisible(GMAIL_DOM.dialog),
		'the "Add custom color" dialog'
	)
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

/**
 * Sidebar label --> Label color --> Add custom color --> background + text --> Apply.
 * For a label applyLabel just created. An uncolored label still works, so failures only warn
 */
export async function colorLabel(labelName: string) {
	await sleep(NEW_LABEL_WAIT_MILLIS)

	let labelBtn: HTMLElement | null = null
	let collapsedSidebar: HTMLElement | null = null

	try {
		labelBtn = await waitFor(() => findSidebarLabel(labelName), `"${labelName}" in the sidebar`)
		collapsedSidebar = findCollapsedSidebar(labelBtn)

		if (collapsedSidebar) await slideOpen(collapsedSidebar)

		const dialog = await openCustomColorDialog(labelBtn)

		await applyCustomColor(dialog)
	} catch (err) {
		console.warn("[Gmail] Created the label, but couldn't color it:", err)
	} finally {
		if (labelBtn) unhover(labelBtn)

		if (collapsedSidebar) collapsedSidebar.dispatchEvent(new MouseEvent("mouseleave"))
	}
}
