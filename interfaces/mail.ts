export type Platform = "gmail" | "outlook" | "proton" | "icloud" | "yahoo" | "unknown"

export interface MailCandidate {
	id: string
	subject: string
	snippet: string
}

export interface MailAdapter {
	platform: Platform
	// Unread messages on the visible page that don't carry the label yet
	getCandidates(labelName: string): MailCandidate[]
	// Full plain-text body. Only called when subject + snippet are inconclusive
	fetchBody(candidate: MailCandidate): Promise<string>
	// Returns fewer (or none) when the user is busy or interrupts; the caller retries those later
	markAsRejection(ids: string[], labelName: string): Promise<string[]>
}
