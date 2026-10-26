<script lang="ts">
	import "./platform-status.css"

	import { onMount } from "svelte"

	import type { IconName } from "@/global-components/icon.map"
	import type { Platform } from "@/interfaces/mail"

	import SvgIcon from "@/global-components/SvgIcon.svelte"

	interface PlatformDetails {
		label: string
		icon: IconName
	}

	let platform: Platform = "unknown"

	const PLATFORM_MAP: Record<Platform, PlatformDetails> = {
		gmail: { label: "Gmail", icon: "gmail" },
		outlook: { label: "Outlook", icon: "outlook" },
		proton: { label: "ProtonMail", icon: "proton" },
		icloud: { label: "iCloud", icon: "icloud" },
		yahoo: { label: "Yahoo", icon: "yahoo" },
		unknown: { label: "Unknown", icon: "globe" },
	}

	$: details = PLATFORM_MAP[platform] || PLATFORM_MAP.unknown

	onMount(async () => {
		const tabs = await browser.tabs.query({ active: true, currentWindow: true })
		const url = tabs[0]?.url || ""

		switch (true) {
			case url.includes("mail.google.com"):
				platform = "gmail"
				break

			case url.includes("outlook.live.com"):
			case url.includes("outlook.office.com"):
				platform = "outlook"
				break

			case url.includes("mail.proton.me"):
				platform = "proton"
				break

			case url.includes("icloud.com/mail"):
				platform = "icloud"
				break

			case url.includes("mail.yahoo.com"):
				platform = "yahoo"
				break

			default:
				platform = "unknown"
		}
	})
</script>

<div class="platform-status flex column full-center">
	<h2>Detected Platform:</h2>

	<div
		class="badge flex row align-center"
		class:detected={platform !== "unknown"}>
		<SvgIcon icon={details.icon} />
		<span>{details.label}</span>
	</div>
</div>
