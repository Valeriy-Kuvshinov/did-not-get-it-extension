const DEFAULT_LABEL = "Put the fries in the bag 🍟"

let pendingIncrements = 0
let isSyncingCount = false

async function syncRejectionCount() {
	if (isSyncingCount || pendingIncrements === 0) return

	isSyncingCount = true

	const incrementsToApply = pendingIncrements

	pendingIncrements = 0

	try {
		const data = await browser.storage.local.get("rejectionCount")
		const currentCount = (data.rejectionCount as number) || 0

		await browser.storage.local.set({ rejectionCount: currentCount + incrementsToApply })
	} catch (err) {
		pendingIncrements += incrementsToApply
		console.error("[Storage] Failed to update rejection counter", err)
	} finally {
		isSyncingCount = false

		if (pendingIncrements > 0) syncRejectionCount()
	}
}

export function incrementRejectionCount() {
	pendingIncrements++
	syncRejectionCount()
}

export async function getRejectionLabel(): Promise<string> {
	const storage = await browser.storage.local.get("rejectionTag")

	return (storage.rejectionTag as string) || DEFAULT_LABEL
}
