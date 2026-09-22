export interface AppStorage {
	rejectionTag: string
	rejectionCount: number
	isAuthenticated: boolean
	isPaused: boolean
}

export type AppStorageChanges = {
	[K in keyof AppStorage]?: {
		newValue?: AppStorage[K]
		oldValue?: AppStorage[K]
	}
}
