const REGEX_STRIP_BLOCKS = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi
const REGEX_STRIP_TAGS = /<[^>]*>?/g

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
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

export function htmlToText(html: string): string {
	return html.replace(REGEX_STRIP_BLOCKS, " ").replace(REGEX_STRIP_TAGS, " ")
}
