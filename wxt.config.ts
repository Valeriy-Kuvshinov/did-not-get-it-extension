import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: {
		name: "Did Not Get It",
		description:
			"Save yourself some time reading corporate jargon, tag job rejection emails in Gmail automatically.",
		permissions: ["storage"],
		host_permissions: ["*://mail.google.com/*"],
	},
})
