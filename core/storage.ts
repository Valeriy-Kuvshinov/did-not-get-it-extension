import { DEFAULT_LABEL } from "@/constants/constants"

export const rejectionTagItem = storage.defineItem<string>("local:rejectionTag", {
	fallback: DEFAULT_LABEL,
})
export const rejectionCountItem = storage.defineItem<number>("local:rejectionCount", {
	fallback: 0,
})
export const isPausedItem = storage.defineItem<boolean>("local:isPaused", {
	fallback: false,
})

export async function saveLabel(tag: string) {
	await rejectionTagItem.setValue(tag.trim() || DEFAULT_LABEL)
}

export async function incrementRejectionCount(by = 1) {
	await rejectionCountItem.setValue((await rejectionCountItem.getValue()) + by)
}
