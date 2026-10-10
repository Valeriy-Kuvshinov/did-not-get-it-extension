import type { AppStorageChanges } from "@/interfaces/storage"

import { ACTION_CHECK_REJECTION } from "./constants/constants"

import { getIkToken, updateRowVisually } from "./utils/dom"
import { getRejectionLabel, incrementRejectionCount } from "./utils/storage"

// DOM Selectors and Attributes
const SELECTOR_UNREAD_ROW = "tr.zA.zE"
const SELECTOR_THREAD_ID_CONTAINER = "span[data-legacy-thread-id]"
const ATTR_THREAD_ID = "data-legacy-thread-id"

let isExtensionPaused = false
let isUserAuthenticated = false
let currentLabel = ""

browser.storage.local.get(["isPaused", "isAuthenticated"]).then((res) => {
	isExtensionPaused = !!res.isPaused
	isUserAuthenticated = !!res.isAuthenticated
})

getRejectionLabel().then((label) => {
	currentLabel = label
})

browser.storage.onChanged.addListener((changes: AppStorageChanges) => {
	const { isPaused, rejectionTag, isAuthenticated } = changes

	if (isPaused?.newValue !== undefined) isExtensionPaused = isPaused.newValue

	if (isAuthenticated?.newValue !== undefined) isUserAuthenticated = isAuthenticated.newValue

	if (rejectionTag?.newValue !== undefined) currentLabel = rejectionTag.newValue
})

async function processRow(
	row: HTMLTableRowElement,
	threadId: string,
	ik: string,
	processedSet: Set<string>
) {
	processedSet.add(threadId)

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
		console.error(`[Content] Failed to message background worker for ${threadId}:`, err)
		processedSet.delete(threadId)
	}
}

export default defineContentScript({
	matches: ["*://mail.google.com/*"],
	main() {
		const processedRows = new Set<string>()

		const observer = new MutationObserver(async () => {
			if (isExtensionPaused || !isUserAuthenticated) return

			const unreadRows = document.querySelectorAll<HTMLTableRowElement>(SELECTOR_UNREAD_ROW)

			if (unreadRows.length === 0) return

			const ik = getIkToken()

			if (!ik) return

			unreadRows.forEach((row) => {
				const spanWithId = row.querySelector<HTMLSpanElement>(SELECTOR_THREAD_ID_CONTAINER)

				if (!spanWithId) return

				const threadId = spanWithId.getAttribute(ATTR_THREAD_ID)

				if (!threadId || processedRows.has(threadId)) return

				processRow(row, threadId, ik, processedRows)
			})
		})
		observer.observe(document.body, { childList: true, subtree: true })
	},
})
