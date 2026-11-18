import { pickAdapter } from "@/providers"

import { Scanner } from "@/core/scanner"

export default defineContentScript({
	matches: ["*://mail.google.com/*"],
	async main(ctx) {
		const adapter = pickAdapter(location.href)

		if (!adapter) return

		const scanner = new Scanner(adapter)

		await scanner.start()

		ctx.onInvalidated(() => scanner.stop())
	},
})
