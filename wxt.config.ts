import { defineConfig } from "wxt"

export default defineConfig({
	manifest: {
		name: "Did Not Get It",
		description:
			"Automatically tag job rejections in Gmail. Skip the corporate fluff and protect your peace.",
		permissions: ["storage", "identity"],
		host_permissions: ["*://mail.google.com/*", "*://gmail.googleapis.com/*"],
		browser_specific_settings: {
			gecko: {
				id: "did-not-get-it@valeriy.com",
				data_collection_permissions: {
					required: ["none"],
				},
			},
		},
	},
})
