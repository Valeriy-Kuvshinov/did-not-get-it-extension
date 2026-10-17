export const ICON_MAP = {
	label: `<svg 
            viewBox="0 0 24 24" width="100%" height="100%">
            <path d="m21.71 11.29-5-5A1 1 0 0 0 16 6H5a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h11a1 1 0 0 0 .71-.29l5-5a1 1 0 0 0 0-1.42M15.59 16H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h10.59l4 4Z"/>
        </svg>`,
	save: `<svg 
            viewBox="0 0 17 17" width="100%" height="100%">
            <path d="M14.164 0H1.5C.673 0 0 .673 0 1.5v14c0 .827.673 1.5 1.5 1.5h14c.827 0 1.5-.673 1.5-1.5V2.776zM8 1v4h3V1h1v5H4V1zM3 16v-6h11v6zm13-.5c0 .275-.225.5-.5.5H15V9H2v7h-.5a.5.5 0 0 1-.5-.5v-14a.5.5 0 0 1 .5-.5H3v6h10V1h.756L16 3.196z"/>
        </svg>`,
}

export type IconName = keyof typeof ICON_MAP
