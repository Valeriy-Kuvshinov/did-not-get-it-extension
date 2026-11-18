<script lang="ts">
	import "./app.css"

	import { onMount, onDestroy } from "svelte"

	import { DEFAULT_LABEL } from "@/constants/constants"

	import { isPausedItem, rejectionCountItem, rejectionTagItem } from "@/core/storage"

	import LabelForm from "./components/label-form/LabelForm.svelte"
	import PlatformStatus from "./components/platform-status/PlatformStatus.svelte"

	let rejectionTag: string = DEFAULT_LABEL
	let rejectionCount: number = 0
	let isPaused: boolean = false

	const unwatchers: (() => void)[] = []

	onMount(async () => {
		rejectionTag = await rejectionTagItem.getValue()
		rejectionCount = await rejectionCountItem.getValue()
		isPaused = await isPausedItem.getValue()

		unwatchers.push(
			rejectionTagItem.watch((value) => (rejectionTag = value)),
			rejectionCountItem.watch((value) => (rejectionCount = value)),
			isPausedItem.watch((value) => (isPaused = value))
		)
	})

	onDestroy(() => unwatchers.forEach((unwatch) => unwatch()))

	async function handleToggle() {
		await isPausedItem.setValue(!isPaused)
	}
</script>

<article
	class="app-container flex column"
	class:firefox-corners={import.meta.env.BROWSER === "firefox"}>
	<header class="app-header flex full-center w-100">
		<h1>Customize Your Rejection</h1>
	</header>

	<LabelForm bind:rejectionTag />

	<div class="scoreboard flex column full-center">
		<span class="text-family-bold">{rejectionCount}</span>
		<span>"Polite" corporate emails detected</span>
	</div>

	<PlatformStatus />

	<section class="toggle-container flex column">
		<h3 style="color: {isPaused ? '#9ca3af' : '#f3f4f6'}">
			Status: {isPaused
				? "Paused - Not labelling Rejections"
				: "Active - Scanning incoming emails"}
		</h3>
		<button
			class="w-fit"
			type="button"
			on:click={handleToggle}>
			{isPaused ? "Resume Scanning" : "Pause Scanning"}
		</button>
	</section>

	<span>Did Not Get It {browser.runtime.getManifest().version}</span>
</article>
