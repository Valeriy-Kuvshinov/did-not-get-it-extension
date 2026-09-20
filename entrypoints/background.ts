import { isRejection } from "./utils/patterns"

const ACTION_CHECK_REJECTION = "checkRejection"

const REGEX_STRIP_HTML = /<[^>]*>?/gm

function buildPrintViewUrl(ik: string, threadId: string) {
	return `https://mail.google.com/mail/u/0/?ui=2&ik=${ik}&view=pt&search=all&th=${threadId}`
}

export default defineBackground(() => {
	browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		if (message.action === ACTION_CHECK_REJECTION) {
			const { threadId, ik } = message

			const fetchUrl = buildPrintViewUrl(ik, threadId)

			console.log(`[Background] Fetching: ${fetchUrl}`)

			fetch(fetchUrl)
				.then((res) => {
					if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

					return res.text()
				})
				.then((html) => {
					const pureText = html.replace(REGEX_STRIP_HTML, " ").replace(/\s+/g, " ").trim()

					const result = isRejection(pureText)

					console.log(
						`[Background] Rejection check for ${threadId}: ${result ? "Job Rejection" : "Irrelevant"}`
					)

					sendResponse({ isRejection: result })
				})
				.catch((err) => {
					console.error("[Background] Fetch error:", err)

					sendResponse({ isRejection: false })
				})

			return true
		}
	})
})
