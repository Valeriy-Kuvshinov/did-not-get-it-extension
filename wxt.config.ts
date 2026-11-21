import { defineConfig } from "wxt"
import { svelte } from "@sveltejs/vite-plugin-svelte"

export default defineConfig({
	manifest: {
		name: "Did Not Get It",
		description:
			"Automatically tag job rejections in Gmail. Skip the corporate fluff and protect your peace.",
		permissions: ["storage", "activeTab"],
		host_permissions: ["*://mail.google.com/*"],
		browser_specific_settings: {
			gecko: {
				id: "did-not-get-it@valeriy.com",
				data_collection_permissions: {
					required: ["none"],
				},
			},
		},
	},
	vite: () => ({
		plugins: [svelte()],
	}),
})
