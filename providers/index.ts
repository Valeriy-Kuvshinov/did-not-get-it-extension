import type { MailAdapter, Platform } from "@/interfaces/mail"

import { gmailAdapter } from "./gmail/adapter"
import { detectPlatform } from "./platforms"

const ADAPTERS: Partial<Record<Platform, MailAdapter>> = {
	gmail: gmailAdapter,
}

export function pickAdapter(url: string): MailAdapter | null {
	const platform = detectPlatform(url)

	return platform ? (ADAPTERS[platform] ?? null) : null
}
