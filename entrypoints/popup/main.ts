import "./styles/variables.css"
import "./styles/base.css"
import "./styles/helpers.css"
import "./styles/typography.css"

import "./popup.css"

import { createSvgIcon } from "@/components/SvgIcon"

const DEFAULT_LABEL = "Put the fries in the bag 🍟"
const SAVE_LABEL_TIMEOUT_MILLIS = 1500

const form = document.querySelector<HTMLFormElement>("#settings-form")!
const input = document.querySelector<HTMLInputElement>("#tag-input")!
const saveBtnText = document.querySelector<HTMLSpanElement>("#save-btn-text")!
const tagLabel = document.querySelector<HTMLLabelElement>("#tag-label")!
const saveBtn = document.querySelector<HTMLButtonElement>("#save-btn")!
const platformStatus = document.querySelector<HTMLHeadingElement>("#platform-status")!
const counterDisplay = document.querySelector<HTMLSpanElement>("#rejection-counter")!

tagLabel.prepend(createSvgIcon({ icon: "label" })!)
saveBtn.prepend(createSvgIcon({ icon: "save" })!)

if (import.meta.env.BROWSER === "firefox") {
	document.querySelector("article")?.classList.add("firefox-corners")
}

browser.storage.local.get(["rejectionTag", "rejectionCount"]).then((result) => {
	input.value = (result.rejectionTag as string) || DEFAULT_LABEL
	counterDisplay.textContent = ((result.rejectionCount as number) || 0).toString()
})

browser.storage.onChanged.addListener((changes, areaName) => {
	const { newValue } = changes.rejectionCount || {}

	if (areaName === "local" && newValue) counterDisplay.textContent = newValue.toString()
})

form.addEventListener("submit", async (e) => {
	e.preventDefault()

	const newTag = input.value.trim()

	await browser.storage.local.set({ rejectionTag: newTag })

	saveBtnText.textContent = "Saved!"

	setTimeout(() => (saveBtnText.textContent = "Save"), SAVE_LABEL_TIMEOUT_MILLIS)
})

// Email platform detection
browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
	const activeTabUrl = tabs[0]?.url || ""

	if (activeTabUrl.includes("mail.google.com")) {
		platformStatus.textContent = "Detected e-mail platform: Gmail"
		platformStatus.style.color = "#16a34a"
	} else {
		platformStatus.textContent = "No e-mail platform detected"
		platformStatus.style.color = "#dc2626"
	}
})
