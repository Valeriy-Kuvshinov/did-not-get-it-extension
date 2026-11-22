<script lang="ts">
	import "./app.css"

	import { onMount, onDestroy } from "svelte"

	import { DEFAULT_LABEL } from "@/constants/constants"

	import { rejectionCountItem, rejectionTagItem, unseenCountItem } from "@/core/storage"

	import Controls from "./components/controls/Controls.svelte"
	import LabelForm from "./components/label-form/LabelForm.svelte"
	import PlatformStatus from "./components/platform-status/PlatformStatus.svelte"

	let rejectionTag: string = DEFAULT_LABEL
	let rejectionCount: number = 0

	const unwatchers: (() => void)[] = []

	onMount(async () => {
		rejectionTag = await rejectionTagItem.getValue()
		rejectionCount = await rejectionCountItem.getValue()

		void unseenCountItem.setValue(0)

		unwatchers.push(
			rejectionTagItem.watch((value) => (rejectionTag = value)),
			rejectionCountItem.watch((value) => (rejectionCount = value)),
			unseenCountItem.watch((unseen) => {
				// The popup already open, toolbar badge has nothing to add
				if (unseen > 0) void unseenCountItem.setValue(0)
			})
		)
	})

	onDestroy(() => unwatchers.forEach((unwatch) => unwatch()))
</script>

<article
	class="app-container flex column"
	class:chrome={import.meta.env.BROWSER === "chrome"}>
	<header class="app-header flex full-center w-100">
		<h1 class="text-family-bold">Customize Your Rejection</h1>
	</header>

	<LabelForm {rejectionTag} />

	<div class="scoreboard flex column full-center">
		<span class="text-family-bold">{rejectionCount}</span>
		<span>"Polite" corporate emails detected</span>
	</div>

	<PlatformStatus />

	<Controls />

	<span class="app-version">Did Not Get It {browser.runtime.getManifest().version}</span>
</article>
