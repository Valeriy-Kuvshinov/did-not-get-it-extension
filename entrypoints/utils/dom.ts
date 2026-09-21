const GM_ID_KEY_REGEX = /var\s+GM_ID_KEY\s*=\s*['"]([^'"]+)['"]/i

let cachedIkToken: string | null = null

export function getIkToken(): string | null {
	if (cachedIkToken) return cachedIkToken

	const html = document.documentElement.innerHTML
	const match = html.match(GM_ID_KEY_REGEX)

	if (match && match[1]) cachedIkToken = match[1]

	return cachedIkToken
}

export function updateRowVisually(row: HTMLTableRowElement, labelText: string) {
	row.classList.remove("zE")
	row.classList.add("yO")

	row.style.setProperty("font-weight", "400", "important")

	row.querySelectorAll<HTMLElement>("span").forEach((span) => {
		span.style.setProperty("font-weight", "400", "important")
	})

	const subjectWrapper = row.querySelector(".bog")

	if (subjectWrapper) {
		const badge = document.createElement("span")
		badge.textContent = labelText
		badge.style.backgroundColor = "#8a1c0a"
		badge.style.color = "white"
		badge.style.padding = "2px 6px"
		badge.style.borderRadius = "4px"
		badge.style.marginRight = "8px"
		badge.style.fontSize = "12px"
		badge.style.setProperty("font-weight", "500", "important")

		subjectWrapper.prepend(badge)
	}
}
