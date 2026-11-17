<script lang="ts">
	import "./app.css"

	import { onMount, onDestroy } from "svelte"

	import { DEFAULT_LABEL } from "../constants/constants"

	import LabelForm from "./components/label-form/LabelForm.svelte"
	import PlatformStatus from "./components/platform-status/PlatformStatus.svelte"

	let rejectionTag: string = DEFAULT_LABEL
	let rejectionCount: number = 0
	let isPaused: boolean = false

	const storageListener = (changes: any, areaName: string) => {
		if (areaName !== "local") return

		const {
			isPaused: pausedChange,
			rejectionCount: countChange,
			rejectionTag: tagChange,
		} = changes

		if (pausedChange?.newValue !== undefined) isPaused = pausedChange.newValue as boolean

		if (countChange?.newValue !== undefined) rejectionCount = countChange.newValue as number

		if (tagChange?.newValue !== undefined) rejectionTag = tagChange.newValue as string
	}

	onMount(async () => {
		const data = await browser.storage.local.get([
			"rejectionTag",
			"rejectionCount",
			"isPaused",
		])

		rejectionTag = (data.rejectionTag as string) || DEFAULT_LABEL
		rejectionCount = (data.rejectionCount as number) || 0
		isPaused = !!data.isPaused

		browser.storage.onChanged.addListener(storageListener)
	})

	onDestroy(() => {
		browser.storage.onChanged.removeListener(storageListener)
	})

	async function handleToggle() {
		await browser.storage.local.set({ isPaused: !isPaused })
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

	<span>Did Not Get It 1.0.2</span>
</article>
