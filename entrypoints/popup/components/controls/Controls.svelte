<script lang="ts">
	import "./controls.css"

	import { onMount, onDestroy } from "svelte"

	import { isAutoReadItem, isPausedItem } from "@/core/storage"

	let isPaused: boolean = false
	let isAutoRead: boolean = true

	const unwatchers: (() => void)[] = []

	onMount(async () => {
		isPaused = await isPausedItem.getValue()
		isAutoRead = await isAutoReadItem.getValue()

		unwatchers.push(
			isPausedItem.watch((value) => (isPaused = value)),
			isAutoReadItem.watch((value) => (isAutoRead = value))
		)
	})

	onDestroy(() => unwatchers.forEach((unwatch) => unwatch()))

	async function handleToggle() {
		await isPausedItem.setValue(!isPaused)
	}

	async function handleAutoReadChange(e: Event & { currentTarget: HTMLInputElement }) {
		await isAutoReadItem.setValue(e.currentTarget.checked)
	}
</script>

<section class="controls flex column">
	<div class="toggle-container flex row justify-between">
		<h3
			class="flex row align-center"
			class:paused={isPaused}>
			Status: {isPaused ? "Paused" : "Active"}
		</h3>
		<button
			class="w-fit"
			type="button"
			on:click={handleToggle}>
			{isPaused ? "Resume Scanning" : "Pause Scanning"}
		</button>
	</div>

	<label class="flex row align-center fast-trans">
		<input
			type="checkbox"
			checked={isAutoRead}
			on:change={handleAutoReadChange} />
		<span>Mark detected rejections as read</span>
	</label>
</section>
