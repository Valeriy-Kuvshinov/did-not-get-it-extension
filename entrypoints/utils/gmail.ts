import { getAuthToken } from "./auth"
import { httpGet, httpPost } from "./http"

interface GmailLabel {
	id: string
	name: string
}

interface LabelsResponse {
	labels: GmailLabel[]
}

const GOOGLE_LABELS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/labels"

function buildLabelModifyUrl(threadId: string) {
	return `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`
}

async function getOrCreateLabel(token: string, labelName: string): Promise<string> {
	const data = await httpGet<LabelsResponse>(GOOGLE_LABELS_URL, token)

	const existing = data.labels?.find((label) => label.name === labelName)

	if (existing) return existing.id

	const createData = await httpPost<GmailLabel>(GOOGLE_LABELS_URL, token, {
		name: labelName,
		labelListVisibility: "labelShow",
		messageListVisibility: "show",
		color: "#8a1c0a",
	})
	return createData.id
}

export async function applyLabelAndMarkRead(threadId: string, labelName: string) {
	const token = await getAuthToken(false)

	const labelId = await getOrCreateLabel(token, labelName)

	await httpPost(buildLabelModifyUrl(threadId), token, {
		addLabelIds: [labelId],
		removeLabelIds: ["UNREAD"],
	})
}
