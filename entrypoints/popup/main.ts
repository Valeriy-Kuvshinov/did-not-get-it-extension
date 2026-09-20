import "./styles/variables.css"
import "./styles/base.css"
import "./styles/helpers.css"
import "./styles/typography.css"

import "./popup.css"

const input = document.querySelector<HTMLInputElement>("#tag-input")!
const saveBtn = document.querySelector<HTMLButtonElement>("#save-btn")!
const platformStatus = document.querySelector<HTMLHeadingElement>("#platform-status")!

const DEFAULT_LABEL = "Put the fries in the bag 🍟"

browser.storage.local.get("rejectionTag").then((result) => {
	const savedTag = result.rejectionTag as string | undefined
	input.value = savedTag || DEFAULT_LABEL
})

saveBtn.addEventListener("click", async (e) => {
	e.preventDefault()

	const newTag = input.value.trim()

	await browser.storage.local.set({ rejectionTag: newTag })

	saveBtn.textContent = "Saved!"

	setTimeout(() => (saveBtn.textContent = "Save"), 1500)
})

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
