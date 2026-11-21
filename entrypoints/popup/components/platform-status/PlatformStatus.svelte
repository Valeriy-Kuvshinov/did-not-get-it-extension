<script lang="ts">
	import "./platform-status.css"

	import { onMount } from "svelte"

	import type { Platform } from "@/shared/interfaces/mail"

	import { detectPlatform } from "@/providers/platforms"

	import SvgIcon from "../svg-icon/SvgIcon.svelte"

	interface PlatformDetails {
		id: Platform
		label: string
		/** Has a working adapter. Flip it when the platform lands */
		isAvailable: boolean
	}

	const PLATFORMS: PlatformDetails[] = [
		{ id: "gmail", label: "Gmail", isAvailable: true },
		{ id: "outlook", label: "Outlook", isAvailable: false },
		{ id: "proton", label: "Proton", isAvailable: false },
		{ id: "icloud", label: "iCloud", isAvailable: false },
		{ id: "yahoo", label: "Yahoo", isAvailable: false },
	]

	let detected: Platform | null = null

	$: comingSoon = PLATFORMS.find(({ id, isAvailable }) => id === detected && !isAvailable)

	onMount(async () => {
		const [tab] = await browser.tabs.query({ active: true, currentWindow: true })

		detected = detectPlatform(tab?.url ?? "")
	})
</script>

<section class="platform-status flex column full-center">
	<h2>Supported Platforms</h2>

	<ul class="platforms grid w-100">
		{#each PLATFORMS as { id, label }}
			<li
				class="badge fast-trans flex column align-center"
				class:detected={id === detected}
				aria-current={id === detected ? "true" : undefined}>
				<SvgIcon icon={id} />
				<span>{label}</span>
			</li>
		{/each}
	</ul>

	{#if comingSoon}
		<span class="coming-soon">{comingSoon.label} support coming soon...</span>
	{/if}
</section>
