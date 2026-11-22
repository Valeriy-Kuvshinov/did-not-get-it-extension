import { waitFor } from "@/shared/utils"

const MOUSE_EVENTS = ["mouseover", "mousedown", "mouseup", "click"]

const USER_INPUT_EVENTS = ["pointerdown", "keydown", "wheel"]

const LISTENER_OPTIONS: AddEventListenerOptions = { capture: true, passive: true }

let lastUserInputAt = -Infinity

/** Called by the browser on each click, key press and scroll. Our synthetic events don't count */
function recordUserInput(e: Event) {
	if (e.isTrusted) lastUserInputAt = performance.now()
}

/** Call at startup, before anything checks userInputSince */
export function startTrackingUserInput() {
	for (const type of USER_INPUT_EVENTS) {
		addEventListener(type, recordUserInput, LISTENER_OPTIONS)
	}
}

export function stopTrackingUserInput() {
	for (const type of USER_INPUT_EVENTS) {
		removeEventListener(type, recordUserInput, LISTENER_OPTIONS)
	}
}

export function userInputSince(time: number): boolean {
	return lastUserInputAt > time
}

export function isVisible(el: Element): boolean {
	return el.getClientRects().length > 0
}

/** querySelectorAll as an array, so find/filter/some work on it */
export function queryAll<T extends Element = HTMLElement>(
	selector: string,
	root: ParentNode = document
): T[] {
	return Array.from(root.querySelectorAll<T>(selector))
}

/** First match that's actually on screen, skipping hidden copies the page keeps around */
export function findVisible<T extends HTMLElement = HTMLElement>(
	selector: string,
	root: ParentNode = document
): T | null {
	return queryAll<T>(selector, root).find(isVisible) ?? null
}

/** Simulate user mouse actions */
export function realClick(el: Element) {
	const rect = el.getBoundingClientRect()

	const init: MouseEventInit = {
		bubbles: true,
		cancelable: true,
		button: 0,
		clientX: rect.left + rect.width / 2,
		clientY: rect.top + rect.height / 2,
	}
	for (const type of MOUSE_EVENTS) {
		el.dispatchEvent(new MouseEvent(type, init))
	}
}

/** Synthetic clicks leave controls in their hover look; this ends it */
export function unhover(el: Element) {
	el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }))
}

/** Fills a text field the way typing would, so the page's input listeners pick it up */
export function typeInto(input: HTMLInputElement, text: string) {
	input.value = text
	input.dispatchEvent(new Event("input", { bubbles: true }))
}

/** Clicks, then waits until the UI reflects it */
export function clickAndWait<T>(
	el: Element,
	check: () => T | null | undefined | false,
	what: string,
	timeoutMs?: number
): Promise<T> {
	realClick(el)

	return waitFor(check, what, timeoutMs)
}

/**
 * Holds the scroll containers around an element in place, undoing scrolls the page makes
 * on its own, like bringing a clicked row into view. Lets go once the user clicks, types or scrolls.
 */
export class ScrollLock {
	private readonly positions = new Map<Element, number>()
	private readonly lockedAt = performance.now()
	private readonly onScroll = this.undoScroll.bind(this)

	constructor(inside: Element) {
		for (let node = inside.parentElement; node; node = node.parentElement) {
			this.positions.set(node, node.scrollTop)
		}
		addEventListener("scroll", this.onScroll, LISTENER_OPTIONS)
	}

	/** Stops holding, after putting back any scroll that hasn't been undone yet */
	release() {
		removeEventListener("scroll", this.onScroll, LISTENER_OPTIONS)

		if (userInputSince(this.lockedAt)) return

		for (const [scroller, top] of this.positions) scroller.scrollTop = top
	}

	/** Scroll events fire before the next frame is drawn, so an undone scroll never shows */
	private undoScroll(e: Event) {
		const scroller = e.target === document ? document.scrollingElement : e.target

		if (!(scroller instanceof Element) || userInputSince(this.lockedAt)) return

		const top = this.positions.get(scroller)

		if (top !== undefined) scroller.scrollTop = top
	}
}
