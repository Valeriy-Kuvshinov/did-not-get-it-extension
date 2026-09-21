import { defineConfig } from "wxt"

export default defineConfig({
	manifest: {
		name: "Did Not Get It",
		description:
			"Save yourself some time reading corporate jargon, tag job rejection emails in Gmail automatically.",
		permissions: ["storage", "identity"],
		host_permissions: ["*://mail.google.com/*", "*://gmail.googleapis.com/*"],
		browser_specific_settings: {
			gecko: {
				id: "did-not-get-it@valeriy.com",
			},
		},
	},
})
