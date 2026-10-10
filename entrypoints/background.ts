import type { ResponseManualAuth } from "@/interfaces/auth"

import {
	ACTION_DISCONNECT,
	ACTION_MANUAL_AUTH,
	ACTION_CHECK_REJECTION,
	DEFAULT_LABEL,
} from "./constants/constants"

import { isRejectionFormat } from "./utils/patterns"
import { revokeAuthToken, getAuthToken } from "./utils/auth"
import { applyLabelAndMarkRead } from "./utils/gmail"

interface Message {
	action: string
}

interface MsgCheckRejection extends Message {
	threadId: string
	ik: string
	labelName: string
}

type ExtensionMessage = MsgCheckRejection | Message

interface ResponseCheckRejection {
	isRejection: boolean
	labelName?: string
}

const REGEX_STRIP_HTML = /<[^>]*>?/gm

function buildPrintViewUrl(ik: string, threadId: string): string {
	return `https://mail.google.com/mail/u/0/?ui=2&ik=${ik}&view=pt&search=all&th=${threadId}`
}

async function checkIfRejection(ik: string, threadId: string): Promise<boolean> {
	const fetchUrl = buildPrintViewUrl(ik, threadId)
	const res = await fetch(fetchUrl)

	if (!res.ok) throw new Error(`HTTP ${res.status} fetching email content`)

	const html = await res.text()
	const pureText = html.replace(REGEX_STRIP_HTML, " ").replace(/\s+/g, " ").trim()

	return isRejectionFormat(pureText)
}

async function applyLabelSafely(threadId: string): Promise<void> {
	try {
		const storage = await browser.storage.local.get("rejectionTag")
		const labelName = (storage.rejectionTag as string) || DEFAULT_LABEL

		await applyLabelAndMarkRead(threadId, labelName)

		console.log(`[Background] API Success for ${threadId}`)
	} catch (apiErr) {
		console.error("[Background] Label API failed, but UI will still update:", apiErr)
	}
}

export default defineBackground(() => {
	browser.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
		if (message.action === ACTION_CHECK_REJECTION) {
			const msg = message as MsgCheckRejection

			checkIfRejection(msg.ik, msg.threadId)
				.then(async (isRejection) => {
					if (isRejection) await applyLabelSafely(msg.threadId)

					sendResponse({
						isRejection,
						labelName: isRejection ? msg.labelName : undefined,
					} as ResponseCheckRejection)
				})
				.catch((err) => {
					console.error("[Background] Fetch error:", err)
					sendResponse({ isRejection: false } as ResponseCheckRejection)
				})
			return true
		}
		if (message.action === ACTION_MANUAL_AUTH) {
			getAuthToken(true)
				.then(() => sendResponse({ success: true } as ResponseManualAuth))
				.catch((err) => {
					console.error("[Background] Manual Auth Error:", err)
					sendResponse({ success: false, error: err.message } as ResponseManualAuth)
				})
			return true
		}
		if (message.action === ACTION_DISCONNECT) {
			revokeAuthToken()
			sendResponse({ success: true })
			return true
		}
	})
})
