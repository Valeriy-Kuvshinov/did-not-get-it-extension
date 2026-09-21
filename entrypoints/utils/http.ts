export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export interface HttpConfig extends RequestInit {
	method: HttpMethod
	headers: Record<string, string>
	body?: string
}

const HTTP_ABORT_TIMEOUT_MILLIS = 1000 * 60 * 3

async function request<T>(
	method: HttpMethod,
	url: string,
	token: string,
	data?: unknown
): Promise<T> {
	const config: HttpConfig = {
		method,
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
		signal: AbortSignal.timeout(HTTP_ABORT_TIMEOUT_MILLIS),
	}

	if (method !== "GET" && data) config.body = JSON.stringify(data)

	try {
		const response = await fetch(url, config)
		const jsonData = await response.json()

		if (!response.ok) {
			throw new Error(
				jsonData.error?.message || `HTTP ${response.status}: ${response.statusText}`
			)
		}
		return jsonData as T
	} catch (err: unknown) {
		console.error(`HTTP Service Error [${method} ${url}]:`, err)
		throw err instanceof Error ? err : new Error(String(err))
	}
}

export async function httpGet<T>(url: string, token: string): Promise<T> {
	return request<T>("GET", url, token)
}

export async function httpPost<T>(url: string, token: string, data?: unknown): Promise<T> {
	return request<T>("POST", url, token, data)
}
