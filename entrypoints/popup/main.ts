import "./styles/variables.css"
import "./styles/base.css"
import "./styles/helpers.css"
import "./styles/typography.css"

import "./popup.css"

import type { AppStorage, AppStorageChanges } from "@/interfaces/storage"
import type { ResponseManualAuth } from "@/interfaces/auth"

import { ACTION_DISCONNECT, ACTION_MANUAL_AUTH, DEFAULT_LABEL } from "../constants/constants"

import { createSvgIcon } from "@/components/SvgIcon"

const SAVE_LABEL_TIMEOUT_MILLIS = 1500
const GMAIL_AUTH_TIMEOUT_MILLIS = 2 * 1000

// Form
const form = document.querySelector<HTMLFormElement>("#label-form")!
const input = document.querySelector<HTMLInputElement>("#tag-input")!
const saveBtnText = document.querySelector<HTMLSpanElement>("#save-btn-text")!
const tagLabel = document.querySelector<HTMLLabelElement>("#tag-label")!
const saveBtn = document.querySelector<HTMLButtonElement>("#save-btn")!

const counterDisplay = document.querySelector<HTMLSpanElement>("#rejection-counter")!

// Gmail Auth
const authContainer = document.querySelector<HTMLElement>("#auth-container")!
const authBtn = document.querySelector<HTMLButtonElement>("#auth-btn")!
const disconnectBtn = document.querySelector<HTMLButtonElement>("#disconnect-btn")!

// Puase / Unpause
const toggleContainer = document.querySelector<HTMLDivElement>("#toggle-container")!
const toggleBtn = document.querySelector<HTMLButtonElement>("#toggle-btn")!
const toggleText = document.querySelector<HTMLHeadingElement>("#toggle-text")!
const toggleBtnText = document.querySelector<HTMLSpanElement>("#toggle-btn-text")!

const platformStatus = document.querySelector<HTMLHeadingElement>("#platform-status")!

tagLabel.append(createSvgIcon({ icon: "label" })!)
saveBtn.append(createSvgIcon({ icon: "save" })!)

if (import.meta.env.BROWSER === "firefox") {
	document.querySelector("article")?.classList.add("firefox-corners")
}

browser.storage.local
	.get(["rejectionTag", "rejectionCount", "isAuthenticated", "isPaused"])
	.then((result) => {
		const data = result as Partial<AppStorage>

		input.value = data.rejectionTag || DEFAULT_LABEL
		counterDisplay.textContent = (data.rejectionCount || 0).toString()

		if (data.isAuthenticated) setAuthUIConnected()

		updateToggleUI(!!data.isPaused)
	})

browser.storage.onChanged.addListener((changes: AppStorageChanges, areaName) => {
	if (areaName !== "local") return

	const { rejectionCount } = changes
	const { newValue } = rejectionCount || {}

	if (newValue) counterDisplay.textContent = newValue.toString()
})

form.addEventListener("submit", async (e) => {
	e.preventDefault()

	const newTag = input.value.trim()

	await browser.storage.local.set({ rejectionTag: newTag })

	saveBtnText.textContent = "Saved!"

	setTimeout(() => (saveBtnText.textContent = "Save"), SAVE_LABEL_TIMEOUT_MILLIS)
})

authBtn.addEventListener("click", async () => {
	try {
		const response = (await browser.runtime.sendMessage({
			action: ACTION_MANUAL_AUTH,
		})) as ResponseManualAuth

		if (response && response.success) {
			await browser.storage.local.set({ isAuthenticated: true })
			setAuthUIConnected()
		} else {
			console.error("Auth failed:", response?.error)
			authBtn.textContent = "Failed!"
			setTimeout(() => (authBtn.textContent = "Connect to Google"), GMAIL_AUTH_TIMEOUT_MILLIS)
		}
	} catch (err) {
		console.error("Messaging failed:", err)
	}
})

toggleBtn.addEventListener("click", async () => {
	const data = await browser.storage.local.get("isPaused")
	const newState = !data.isPaused

	await browser.storage.local.set({ isPaused: newState })

	updateToggleUI(newState)
})

disconnectBtn.addEventListener("click", async () => {
	await browser.runtime.sendMessage({ action: ACTION_DISCONNECT })

	await browser.storage.local.set({ isAuthenticated: false, isPaused: false })

	toggleContainer.style.display = "none"
	authContainer.style.display = "flex"
})

function setAuthUIConnected() {
	authContainer.style.display = "none"
	toggleContainer.style.display = "flex"
}

function updateToggleUI(isPaused: boolean) {
	if (isPaused) {
		toggleText.textContent = "Status: Paused - Not labelling Rejections"
		toggleText.style.color = "#9ca3af"
		toggleBtnText.textContent = "Resume Scanning"
	} else {
		toggleText.textContent = "Status: Active - Scanning incoming emails"
		toggleText.style.color = "#f3f4f6"
		toggleBtnText.textContent = "Pause Scanning"
	}
}

// Email platform detection
browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
	const activeTabUrl = tabs[0]?.url || ""

	if (activeTabUrl.includes("mail.google.com")) {
		platformStatus.textContent = "Detected platform: Gmail"
		platformStatus.style.color = "#16a34a"
	} else {
		platformStatus.textContent = "No e-mail platform detected"
		platformStatus.style.color = "#dc2626"
	}
})
