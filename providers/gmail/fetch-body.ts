import type { MailCandidate } from "@/shared/interfaces/mail"

import { htmlToText } from "@/shared/utils"

const GM_ID_KEY_REGEX = /var\s+GM_ID_KEY\s*=\s*['"]([^'"]+)['"]/i
const ACCOUNT_INDEX_REGEX = /\/u\/(\d+)/

let cachedIk: string | null = null

function getIkToken(): string {
	if (cachedIk) return cachedIk

	const ik = document.documentElement.innerHTML.match(GM_ID_KEY_REGEX)?.[1]

	if (!ik) throw new Error("[Gmail] GM_ID_KEY not found on the page")

	cachedIk = ik

	return ik
}

function getAccountIndex(): string {
	return window.location.pathname.match(ACCOUNT_INDEX_REGEX)?.[1] ?? "0"
}

/** Gmail's print view: same-origin, uses the session cookies, no API or OAuth. */
export async function fetchBody(candidate: MailCandidate): Promise<string> {
	const params = new URLSearchParams({
		ui: "2",
		ik: getIkToken(),
		view: "pt",
		search: "all",
		th: candidate.id,
	})
	const res = await fetch(`${location.origin}/mail/u/${getAccountIndex()}/?${params}`)

	if (!res.ok) throw new Error(`[Gmail] HTTP ${res.status} fetching thread ${candidate.id}`)

	return htmlToText(await res.text())
}
