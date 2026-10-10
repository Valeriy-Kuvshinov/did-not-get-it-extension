const REJECTION_PATTERNS: RegExp[] = [
	// Moving forward with someone else
	/(?:move forward|proceed|advancing) with (?:other|another) (?:candidate|applicant)s?/i,

	// Not moving forward with you
	/not (?:to |be )?mov(?:e|ing) forward/i,
	/will not (?:continue|proceed) with your candidacy/i,

	// Went with someone else
	/(?:pursue|pursuing|consider|chosen) (?:other|another) (?:candidate|applicant)s?/i,
	/other candidates whose (?:qualifications|skills|experience)/i,

	// Position closed
	/position (?:is|has been) (?:now closed|no longer open|filled)/i,
	/unfortunately, .* no longer open/i,

	// Not a match / Not selected
	// Specifically checks for the negative prefix so it ignores "good match" or "strong match"
	/(?:does not(?: fully)? match|not a match|don'?t have a match|wasn'?t a match)/i,
	/decided not to select/i,
]

export function isRejectionFormat(text: string): boolean {
	return REJECTION_PATTERNS.some((regex) => regex.test(text))
}
