// DOM Selectors and Attributes
const SELECTOR_UNREAD_ROW = "tr.zA.zE"
const SELECTOR_THREAD_ID_CONTAINER = "span[data-legacy-thread-id]"
const ATTR_THREAD_ID = "data-legacy-thread-id"

const ACTION_CHECK_REJECTION = "checkRejection"

const GM_ID_KEY_REGEX = /var\s+GM_ID_KEY\s*=\s*['"]([^'"]+)['"]/i

let pendingIncrements = 0
let isSyncingCount = false

async function syncRejectionCount() {
	if (isSyncingCount || pendingIncrements === 0) return

	isSyncingCount = true

	const incrementsToApply = pendingIncrements

	pendingIncrements = 0

	try {
		const data = await browser.storage.local.get("rejectionCount")
		const currentCount = (data.rejectionCount as number) || 0

		await browser.storage.local.set({ rejectionCount: currentCount + incrementsToApply })
	} catch (err) {
		console.error("[Content] Failed to update rejection counter", err)
		pendingIncrements += incrementsToApply
	} finally {
		isSyncingCount = false

		if (pendingIncrements > 0) syncRejectionCount()
	}
}

export default defineContentScript({
	matches: ["*://mail.google.com/*"],
	main() {
		const processedRows = new Set<string>()

		let cachedIkToken: string | null = null

		const getIkToken = (): string | null => {
			if (cachedIkToken) return cachedIkToken

			const html = document.documentElement.innerHTML
			const match = html.match(GM_ID_KEY_REGEX)

			if (match && match[1]) cachedIkToken = match[1]

			return cachedIkToken
		}

		const observer = new MutationObserver(async () => {
			const unreadRows = document.querySelectorAll<HTMLTableRowElement>(SELECTOR_UNREAD_ROW)

			if (unreadRows.length === 0) return

			const ik = getIkToken()

			if (!ik) {
				console.error("Could not extract IK token from page, in order to read mails")
				return
			}
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
					})
					if (response && response.isRejection) {
						console.log(`REJECTION DETECTED for thread: ${threadId}`)

						// Queue the increment and sync to storage
						pendingIncrements++
						syncRejectionCount()

						// TODO: Apply the label and mark as read
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
