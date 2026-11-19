const REGEX_STRIP_BLOCKS = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi
const REGEX_STRIP_TAGS = /<[^>]*>?/g

const CLICK_SEQUENCE = ["mouseover", "mousedown", "mouseup", "click"]

let lastUserInputAt = -Infinity

function recordUserInput(e: Event) {
	if (e.isTrusted) lastUserInputAt = performance.now()
}

for (const type of ["pointerdown", "keydown", "wheel"]) {
	addEventListener(type, recordUserInput, { capture: true, passive: true })
}

export function userInputSince(time: number): boolean {
	return lastUserInputAt > time
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isVisible(el: Element): boolean {
	return el.getClientRects().length > 0
}

export function queryAll<T extends Element = HTMLElement>(
	selector: string,
	root: ParentNode = document
): T[] {
	return Array.from(root.querySelectorAll<T>(selector))
}

export function findVisible<T extends HTMLElement = HTMLElement>(
	selector: string,
	root: ParentNode = document
): T | null {
	return queryAll<T>(selector, root).find(isVisible) ?? null
}

/** Polls until `check` returns something truthy */
export async function waitFor<T>(
	check: () => T | null | undefined | false,
	what: string,
	timeoutMs = 3000
): Promise<T> {
	const deadline = performance.now() + timeoutMs

	for (;;) {
		const result = check()

		if (result) return result

		if (performance.now() >= deadline) break

		await sleep(50)
	}
	throw new Error(`Timed out after ${timeoutMs}ms waiting for ${what}`)
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
	for (const type of CLICK_SEQUENCE) {
		el.dispatchEvent(new MouseEvent(type, init))
	}
}

/** End Gmail's hover styling */
export function unhover(el: Element) {
	el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }))
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

export function htmlToText(html: string): string {
	return html.replace(REGEX_STRIP_BLOCKS, " ").replace(REGEX_STRIP_TAGS, " ")
}
