import type { MailAdapter, Platform } from "@/interfaces/mail"

import { gmailAdapter } from "./gmail/adapter"
import { isRecognizedPlatform } from "./platforms"

const ADAPTERS: Partial<Record<Platform, MailAdapter>> = {
	gmail: gmailAdapter,
}

export function pickAdapter(url: string): MailAdapter | null {
	return ADAPTERS[isRecognizedPlatform(url)] ?? null
}
