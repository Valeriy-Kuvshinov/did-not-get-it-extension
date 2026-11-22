import { pickAdapter } from "@/providers"

import { Scanner } from "@/core/scanner"

import { startTrackingUserInput, stopTrackingUserInput } from "@/providers/dom"

export default defineContentScript({
	matches: ["*://mail.google.com/*"],
	async main(ctx) {
		const adapter = pickAdapter(location.href)

		if (!adapter) return

		const scanner = new Scanner(adapter)

		startTrackingUserInput()

		await scanner.start()

		ctx.onInvalidated(() => {
			scanner.stop()
			stopTrackingUserInput()
		})
	},
})
