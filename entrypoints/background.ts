import { getAuthToken } from "./utils/auth"
import { applyLabelAndMarkRead } from "./utils/gmail"
import { isRejectionFormat } from "./utils/patterns"

const DEFAULT_LABEL = "Put the fries in the bag 🍟"

const ACTION_CHECK_REJECTION = "checkRejection"

const ACTION_MANUAL_AUTH = "manualAuth"

const REGEX_STRIP_HTML = /<[^>]*>?/gm

function buildPrintViewUrl(ik: string, threadId: string) {
	return `https://mail.google.com/mail/u/0/?ui=2&ik=${ik}&view=pt&search=all&th=${threadId}`
}

export default defineBackground(() => {
	browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		if (message.action === ACTION_CHECK_REJECTION) {
			const { threadId, ik } = message

			const fetchUrl = buildPrintViewUrl(ik, threadId)

			fetch(fetchUrl)
				.then((res) => res.text())
				.then(async (html) => {
					const pureText = html.replace(REGEX_STRIP_HTML, " ").replace(/\s+/g, " ").trim()
					const result = isRejectionFormat(pureText)

					if (result) {
						try {
							const storage = await browser.storage.local.get("rejectionTag")
							const labelName =
								(storage.rejectionTag as string) || "Put the fries in the bag 🍟"

							await applyLabelAndMarkRead(threadId, labelName)
							console.log(`[Background] API Success for ${threadId}`)
						} catch (apiErr) {
							console.error(
								"[Background] Label API failed, but UI will still update:",
								apiErr
							)
						}
					}
					sendResponse({
						isRejection: result,
						labelName: result ? message.labelName : undefined,
					})
				})
				.catch((err) => {
					console.error("[Background] Fetch error:", err)
					sendResponse({ isRejection: false })
				})
			return true
		}

		if (message.action === ACTION_MANUAL_AUTH) {
			getAuthToken(true)
				.then(() => sendResponse({ success: true }))
				.catch((err) => {
					console.error("[Background] Manual Auth Error:", err)
					sendResponse({ success: false, error: err.message })
				})
			return true
		}
	})
})
