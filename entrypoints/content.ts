export default defineContentScript({
	matches: ["*://mail.google.com/*"],
	main() {
		console.log("🍟 'Did Not Get It' loaded. Watching for rejections...")

		const processedRows = new Set<string>()

		const observer = new MutationObserver((mutations) => {
			const unreadRows = document.querySelectorAll<HTMLTableRowElement>("tr.zA.zE")

			unreadRows.forEach((row) => {
				// Find the element containing the thread IDs
				const spanWithId = row.querySelector<HTMLSpanElement>("span[data-legacy-thread-id]")

				if (!spanWithId) return

				const threadId = spanWithId.getAttribute("data-legacy-thread-id")

				if (!threadId || processedRows.has(threadId)) return

				processedRows.add(threadId)

				console.log(`Found new unread email! Thread ID: ${threadId}`)
			})
		})
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		})
	},
})
