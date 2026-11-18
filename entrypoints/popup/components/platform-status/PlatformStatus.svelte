<script lang="ts">
	import "./platform-status.css"

	import { onMount } from "svelte"

	import type { IconName } from "@/global-components/icon.map"
	import type { Platform } from "@/interfaces/mail"

	import { isRecognizedPlatform } from "@/providers/platforms"

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

		platform = isRecognizedPlatform(tabs[0]?.url ?? "")
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
