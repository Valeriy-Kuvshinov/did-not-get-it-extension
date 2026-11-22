<script lang="ts">
	import "./label-form.css"

	import { sleep } from "@/shared/utils"

	import { DEFAULT_LABEL } from "@/constants/constants"

	import { saveLabel } from "@/core/storage"

	import SvgIcon from "../svg-icon/SvgIcon.svelte"

	export let rejectionTag: string

	const ILLEGAL_CHARS = ["/", "\\"]

	const GMAIL_RESERVED_LABELS = [
		"inbox",
		"starred",
		"snoozed",
		"important",
		"chats",
		"sent",
		"scheduled",
		"drafts",
		"all mail",
		"spam",
		"trash",
		"purchases",
		"social",
		"updates",
		"forums",
		"promotions",
	]
	const SAVE_LABEL_TIMEOUT_MILLIS = 1500

	let draft = rejectionTag
	let btnText = "Save"

	/** "/" nests labels in Gmail, and the reserved names are Gmail's own */
	function getNameError(label: string): string {
		const illegalChar = ILLEGAL_CHARS.find((char) => label.includes(char))

		if (illegalChar) return `Illegal character: "${illegalChar}"`

		if (GMAIL_RESERVED_LABELS.includes(label.toLowerCase())) {
			return `"${label}" is one of Gmail's built-in labels`
		}
		return ""
	}

	// Refills the input when the saved label changes: once loaded, and after each save
	$: draft = rejectionTag

	// What would get saved: trimmed, or the default when blank
	$: label = draft.trim() || DEFAULT_LABEL
	$: error = getNameError(label)
	$: canSave = !error && label !== rejectionTag

	async function handleSave(e: Event) {
		e.preventDefault()

		if (!canSave) return

		await saveLabel(label)

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
			<span>Label</span>
			<SvgIcon icon="label" />
		</label>
		<input
			type="text"
			id="tag-input"
			bind:value={draft}
			aria-invalid={!!error}
			aria-describedby="tag-note"
			placeholder="Insert something humorous..."
			maxlength="28" />
	</div>
	<button
		class="flex row align-center h-fit"
		type="submit"
		disabled={!canSave}>
		<span>{btnText}</span>
		<SvgIcon icon="save" />
	</button>
	{#if error}
		<span
			id="tag-note"
			class="tag-error"
			role="alert">
			{error}
		</span>
	{:else}
		<span
			id="tag-note"
			class="tag-hint">
			If this label already exists, rejections are added to it
		</span>
	{/if}
</form>
