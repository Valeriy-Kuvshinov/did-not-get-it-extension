const CLIENT_ID = "682125325975-eamf6fht1le31qgpjkrsg49qur0kvov0.apps.googleusercontent.com"

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"

let cachedToken: string | null = null
let tokenExpiry = 0

export async function getAuthToken(interactive = false): Promise<string> {
	if (cachedToken && Date.now() < tokenExpiry) return cachedToken

	const redirectUrl = browser.identity.getRedirectURL()
	const authUrl = new URL(GOOGLE_OAUTH_URL)

	authUrl.searchParams.append("client_id", CLIENT_ID)
	authUrl.searchParams.append("response_type", "token")
	authUrl.searchParams.append("redirect_uri", redirectUrl)
	authUrl.searchParams.append("scope", SCOPES.join(" "))

	if (interactive) authUrl.searchParams.append("prompt", "select_account")

	const responseUrl = await browser.identity.launchWebAuthFlow({
		url: authUrl.toString(),
		interactive,
	})

	const urlParams = new URLSearchParams(new URL(responseUrl!.replace("#", "?")).search)
	const token = urlParams.get("access_token")
	const expiresIn = parseInt(urlParams.get("expires_in") || "3600", 10)

	if (!token) throw new Error("Authentication failed: No token returned")

	cachedToken = token
	tokenExpiry = Date.now() + expiresIn * 1000 - 60000

	await browser.storage.local.set({ isAuthenticated: true })

	return token
}

export async function revokeAuthToken(): Promise<void> {
	if (cachedToken) {
		try {
			await fetch(`${GOOGLE_REVOKE_URL}?token=${cachedToken}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			})
			console.log("[Auth] Token successfully revoked with Google.")
		} catch (err) {
			console.error("[Auth] Failed to revoke token:", err)
		}
	}
	cachedToken = null
	tokenExpiry = 0
}
