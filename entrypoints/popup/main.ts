import "./styles/variables.css"
import "./styles/base.css"
import "./styles/helpers.css"
import "./styles/typography.css"

const input = document.querySelector<HTMLInputElement>("#tag-input")!
const saveBtn = document.querySelector<HTMLButtonElement>("#save-btn")!

const DEFAULT_LABEL = "Put the fries in the bag 🍟"

browser.storage.local.get("rejectionTag").then((result) => {
	const savedTag = result.rejectionTag as string | undefined

	input.value = savedTag || DEFAULT_LABEL
})

saveBtn.addEventListener("click", async () => {
	const newTag = input.value.trim()

	await browser.storage.local.set({ rejectionTag: newTag })

	saveBtn.textContent = "Saved!"

	setTimeout(() => (saveBtn.textContent = "Save"), 1500)
})
