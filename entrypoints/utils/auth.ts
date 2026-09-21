const CLIENT_ID = import.meta.env.WXT_GOOGLE_CLIENT_ID || ""

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

let cachedToken: string | null = null
let tokenExpiry = 0

export async function getAuthToken(interactive: boolean = false): Promise<string> {
	if (cachedToken && Date.now() < tokenExpiry) return cachedToken

	const redirectUrl = browser.identity.getRedirectURL()
	const authUrl = new URL(GOOGLE_AUTH_URL)

	authUrl.searchParams.append("client_id", CLIENT_ID)
	authUrl.searchParams.append("response_type", "token")
	authUrl.searchParams.append("redirect_uri", redirectUrl)
	authUrl.searchParams.append("scope", SCOPES.join(" "))

	const responseUrl = await browser.identity.launchWebAuthFlow({
		url: authUrl.toString(),
		interactive,
	})

	const urlParams = new URLSearchParams(new URL(responseUrl!.replace("#", "?")).search)
	const token = urlParams.get("access_token")
	const expiresIn = parseInt(urlParams.get("expires_in") || "3600", 10)

	if (!token) throw new Error("Authentication failed: No token returned.")

	cachedToken = token
	tokenExpiry = Date.now() + expiresIn * 1000 - 60000

	return token
}
