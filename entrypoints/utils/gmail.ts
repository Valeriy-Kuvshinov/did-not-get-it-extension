import { getAuthToken } from "./auth"

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
	const res = await fetch(GOOGLE_LABELS_URL, {
		headers: { Authorization: `Bearer ${token}` },
	})

	if (!res.ok) throw new Error(`Failed to fetch labels: ${await res.text()}`)

	const data: LabelsResponse = await res.json()
	const existing = data.labels?.find((label) => label.name === labelName)

	if (existing) return existing.id

	const createRes = await fetch(GOOGLE_LABELS_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			name: labelName,
			labelListVisibility: "labelShow",
			messageListVisibility: "show",
			color: { textColor: "#ffffff", backgroundColor: "#8a1c0a" },
		}),
	})
	if (!createRes.ok) throw new Error(`Failed to create label: ${await createRes.text()}`)

	const createData: GmailLabel = await createRes.json()

	return createData.id
}

export async function applyLabelAndMarkRead(threadId: string, labelName: string) {
	const token = await getAuthToken(false)

	const labelId = await getOrCreateLabel(token, labelName)

	const modifyRes = await fetch(buildLabelModifyUrl(threadId), {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			addLabelIds: [labelId],
			removeLabelIds: ["UNREAD"],
		}),
	})
	if (!modifyRes.ok) throw new Error(`Failed to modify thread: ${await modifyRes.text()}`)
}
