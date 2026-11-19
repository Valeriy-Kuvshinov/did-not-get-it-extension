import { DEFAULT_LABEL } from "@/constants/constants"

/** User's custom label. Displayed in detected rejections */
export const rejectionTagItem = storage.defineItem<string>("local:rejectionTag", {
	fallback: DEFAULT_LABEL,
})
/** Rejections so far. Displayed in the scoreboard */
export const rejectionCountItem = storage.defineItem<number>("local:rejectionCount", {
	fallback: 0,
})
/** Pause/resume scanning for rejections. Disable/enable the extension */
export const isPausedItem = storage.defineItem<boolean>("local:isPaused", {
	fallback: false,
})
/** Mark detected rejections as read, or only label them */
export const isAutoReadItem = storage.defineItem<boolean>("local:isAutoRead", {
	fallback: true,
})
/** Rejections since the popup was last opened. Displayed in the pinned toolbar badge */
export const unseenCountItem = storage.defineItem<number>("local:unseenCount", {
	fallback: 0,
})

export async function saveLabel(tag: string) {
	await rejectionTagItem.setValue(tag.trim() || DEFAULT_LABEL)
}

export async function incrementRejectionCount(by = 1) {
	await rejectionCountItem.setValue((await rejectionCountItem.getValue()) + by)
	await unseenCountItem.setValue((await unseenCountItem.getValue()) + by)
}
