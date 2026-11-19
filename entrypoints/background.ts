import { unseenCountItem } from "@/core/storage"

const BADGE_COLOR = "#86051f"
const BADGE_MAX = 99

function getAction() {
	return browser.action ?? browser.browserAction // MV3 or MV2
}

function updateBadge(unseen: number) {
	const text = unseen === 0 ? "" : unseen > BADGE_MAX ? `${BADGE_MAX}+` : `${unseen}`

	void getAction().setBadgeText({ text })
}

export default defineBackground(() => {
	void getAction().setBadgeBackgroundColor({ color: BADGE_COLOR })

	void unseenCountItem.getValue().then(updateBadge)

	unseenCountItem.watch(updateBadge)
})
