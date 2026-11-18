const REJECTION_PATTERNS: RegExp[] = [
	// Definitive regret / unfortunately statements
	/unfortunately[,\s]+(?:we )?(?:have )?(?:decided|chosen|selected|determined)/i,
	/regret to inform you/i,

	// "The council has decided"
	/after careful(?:ly)? (?:review|reviewing|consideration)[,\s]+(?:we )?(?:have |'ve )?decided/i,

	// Not moving forward
	/(?:decided|chosen|determined|will|are|'re|do|did)\s+not (?:to |be )?mov(?:e|ing) forward/i,
	/will not (?:be )?(?:continuing|proceeding) with your (?:candidacy|application)/i,

	// Went with someone else
	/(?:decided to|going to)?\s?(?:move forward|proceed|advancing|pursue|consider) (?:with )?(?:other|another) (?:candidate|applicant|profile)s?/i,
	/other candidates (?:whose|with) (?:backgrounds?|experience|skills) (?:better|more closely) align/i,

	// The "Different Direction" template
	/(?:decided to|going to) (?:go|move) in a different direction/i,

	// Position filled or closed
	/position (?:is|has been) (?:now closed|no longer open|filled)/i,

	// Not a match
	/(?:does not(?: fully)? match|not a match|don'?t have a match|wasn'?t a match)/i,
	/decided not to advance your application/i,
	/not selected to (?:move forward|proceed|continue|interview)/i,

	// The "Impressive but no" template
	/(?:while|although) your (?:background|experience) is (?:certainly |very |indeed )?impressive/i,
]

/** Purge apostrophe variants like `don'?t` to process the text normally */
function normalizeText(text: string): string {
	return text
		.replace(/&#39;|&#x27;|&rsquo;|&lsquo;|[\u2018\u2019]/g, "'")
		.replace(/&nbsp;|\s+/g, " ")
}

export function isRejectionFormat(text: string): boolean {
	const normalized = normalizeText(text)

	return REJECTION_PATTERNS.some((regex) => regex.test(normalized))
}
