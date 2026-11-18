import type { Platform } from "@/interfaces/mail"

const PLATFORM_URLS: Record<Exclude<Platform, "unknown">, string[]> = {
	gmail: ["mail.google.com"],
	outlook: ["outlook.live.com", "outlook.office.com"],
	proton: ["mail.proton.me"],
	icloud: ["icloud.com/mail"],
	yahoo: ["mail.yahoo.com"],
}

export function isRecognizedPlatform(url: string): Platform {
	for (const [platform, parts] of Object.entries(PLATFORM_URLS)) {
		if (parts.some((part) => url.includes(part))) return platform as Platform
	}
	return "unknown"
}
