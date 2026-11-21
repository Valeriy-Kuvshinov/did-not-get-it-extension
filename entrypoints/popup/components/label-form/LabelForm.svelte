<script lang="ts">
	import "./label-form.css"

	import { sleep } from "@/shared/utils"

	import { saveLabel } from "@/core/storage"

	import SvgIcon from "../svg-icon/SvgIcon.svelte"

	export let rejectionTag: string

	const SAVE_LABEL_TIMEOUT_MILLIS = 1500

	let btnText = "Save"

	async function handleSave(e: Event) {
		e.preventDefault()

		await saveLabel(rejectionTag)

		btnText = "Saved!"
		await sleep(SAVE_LABEL_TIMEOUT_MILLIS)
		btnText = "Save"
	}
</script>

<form
	class="grid w-100"
	on:submit={handleSave}>
	<div class="input-area flex column">
		<label
			for="tag-input"
			class="flex row align-center">
			<span>Custom Label</span>
			<SvgIcon icon="label" />
		</label>
		<input
			type="text"
			id="tag-input"
			bind:value={rejectionTag}
			placeholder="Insert something humorous here..."
			maxlength="30" />
	</div>
	<button
		class="flex row align-center h-fit"
		type="submit">
		<span>{btnText}</span>
		<SvgIcon icon="save" />
	</button>
</form>
