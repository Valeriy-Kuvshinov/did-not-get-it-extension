import type { Platform } from "@/interfaces/mail"

const PLATFORM_URLS: Record<Platform, string[]> = {
	gmail: ["mail.google.com"],
	outlook: ["outlook.live.com", "outlook.office.com"],
	proton: ["mail.proton.me"],
	icloud: ["icloud.com/mail"],
	yahoo: ["mail.yahoo.com"],
}

export function detectPlatform(url: string): Platform | null {
	for (const [platform, parts] of Object.entries(PLATFORM_URLS)) {
		if (parts.some((part) => url.includes(part))) return platform as Platform
	}
	return null
}
