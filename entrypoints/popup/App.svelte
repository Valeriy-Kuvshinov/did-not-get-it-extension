<script lang="ts">
	import "./app.css"

	import { onMount, onDestroy } from "svelte"

	import { DEFAULT_LABEL, ACTION_MANUAL_AUTH, ACTION_DISCONNECT } from "../constants/constants"

	import LabelForm from "./components/LabelForm.svelte"

	const GMAIL_AUTH_TIMEOUT_MILLIS = 2000

	let rejectionTag: string = DEFAULT_LABEL
	let rejectionCount: number = 0
	let isAuthenticated: boolean = false
	let isPaused: boolean = false

	let authBtnText = "Connect to Google"
	let platformText = "Checking platform..."
	let platformColor = "inherit"

	const storageListener = (changes: any, areaName: string) => {
		if (areaName !== "local") return

		const {
			isPaused: pausedChange,
			isAuthenticated: authChange,
			rejectionCount: countChange,
			rejectionTag: tagChange,
		} = changes

		if (pausedChange?.newValue !== undefined) isPaused = pausedChange.newValue as boolean

		if (authChange?.newValue !== undefined) isAuthenticated = authChange.newValue as boolean

		if (countChange?.newValue !== undefined) rejectionCount = countChange.newValue as number

		if (tagChange?.newValue !== undefined) rejectionTag = tagChange.newValue as string
	}

	onMount(async () => {
		const data = await browser.storage.local.get([
			"rejectionTag",
			"rejectionCount",
			"isAuthenticated",
			"isPaused",
		])

		rejectionTag = (data.rejectionTag as string) || DEFAULT_LABEL
		rejectionCount = (data.rejectionCount as number) || 0
		isAuthenticated = !!data.isAuthenticated
		isPaused = !!data.isPaused

		browser.storage.onChanged.addListener(storageListener)

		const tabs = await browser.tabs.query({ active: true, currentWindow: true })
		const activeTabUrl = tabs[0]?.url || ""

		if (activeTabUrl.includes("mail.google.com")) {
			platformText = "Detected platform: Gmail"
			platformColor = "#16a34a"
		} else {
			platformText = "No e-mail platform detected"
			platformColor = "#dc2626"
		}
	})

	onDestroy(() => {
		browser.storage.onChanged.removeListener(storageListener)
	})

	async function handleAuth() {
		try {
			const response = await browser.runtime.sendMessage({ action: ACTION_MANUAL_AUTH })

			if (response && response.success) {
				await browser.storage.local.set({ isAuthenticated: true })
			} else {
				console.error("Auth failed:", response?.error)
				authBtnText = "Failed!"

				setTimeout(() => (authBtnText = "Connect to Google"), GMAIL_AUTH_TIMEOUT_MILLIS)
			}
		} catch (err) {
			console.error("Messaging failed:", err)
		}
	}

	async function handleToggle() {
		await browser.storage.local.set({ isPaused: !isPaused })
	}

	async function handleDisconnect() {
		await browser.runtime.sendMessage({ action: ACTION_DISCONNECT })
		await browser.storage.local.set({ isAuthenticated: false, isPaused: false })
	}
</script>

<article
	class="app-container flex column {import.meta.env.BROWSER === 'firefox'
		? 'firefox-corners'
		: ''}">
	<header class="app-header flex full-center w-100">
		<h1>Customize Your Rejection</h1>
	</header>

	<LabelForm bind:rejectionTag />

	<div class="scoreboard flex column full-center">
		<span class="text-family-bold">{rejectionCount}</span>
		<span>"Polite" corporate emails detected</span>
	</div>

	<h2
		class="platform-status text-center"
		style="color: {platformColor}">
		{platformText}
	</h2>

	{#if !isAuthenticated}
		<section class="auth-container flex column">
			<h3>Gmail connection required to apply labels</h3>
			<button
				class="w-fit"
				type="button"
				on:click={handleAuth}>
				<span>{authBtnText}</span>
			</button>
		</section>
	{:else}
		<section class="toggle-container flex column">
			<h3 style="color: {isPaused ? '#9ca3af' : '#f3f4f6'}">
				Status: {isPaused
					? "Paused - Not labelling Rejections"
					: "Active - Scanning incoming emails"}
			</h3>
			<div class="actions flex row justify-between">
				<button
					class="toggle-btn w-fit"
					type="button"
					on:click={handleToggle}>
					<span>{isPaused ? "Resume Scanning" : "Pause Scanning"}</span>
				</button>
				<button
					class="disconnect-btn"
					type="button"
					on:click={handleDisconnect}>
					<span>Disconnect Google</span>
				</button>
			</div>
		</section>
	{/if}

	<span>Did Not Get It 1.0.1</span>
</article>
