import { getIkToken, updateRowVisually } from "./utils/dom"
import { getRejectionLabel, incrementRejectionCount } from "./utils/storage"

// DOM Selectors and Attributes
const SELECTOR_UNREAD_ROW = "tr.zA.zE"
const SELECTOR_THREAD_ID_CONTAINER = "span[data-legacy-thread-id]"
const ATTR_THREAD_ID = "data-legacy-thread-id"

const ACTION_CHECK_REJECTION = "checkRejection"

export default defineContentScript({
	matches: ["*://mail.google.com/*"],
	main() {
		const processedRows = new Set<string>()

		const observer = new MutationObserver(async () => {
			const unreadRows = document.querySelectorAll<HTMLTableRowElement>(SELECTOR_UNREAD_ROW)

			if (unreadRows.length === 0) return

			const ik = getIkToken()

			if (!ik) return

			const currentLabel = await getRejectionLabel()

			unreadRows.forEach(async (row) => {
				const spanWithId = row.querySelector<HTMLSpanElement>(SELECTOR_THREAD_ID_CONTAINER)

				if (!spanWithId) return

				const threadId = spanWithId.getAttribute(ATTR_THREAD_ID)

				if (!threadId || processedRows.has(threadId)) return

				processedRows.add(threadId)

				try {
					const response = await browser.runtime.sendMessage({
						action: ACTION_CHECK_REJECTION,
						threadId: threadId,
						ik: ik,
						labelName: currentLabel,
					})

					if (response && response.isRejection) {
						console.log(`REJECTION DETECTED for thread: ${threadId}`)

						incrementRejectionCount()
						updateRowVisually(row, currentLabel)
					}
				} catch (err) {
					console.error(
						`[Content] Failed to message background worker for ${threadId}:`,
						err
					)
				}
			})
		})
		observer.observe(document.body, { childList: true, subtree: true })
	},
})
