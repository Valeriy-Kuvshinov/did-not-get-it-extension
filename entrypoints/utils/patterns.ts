const REJECTION_PATTERNS: RegExp[] = [
	// Definitive regret / unfortunately statements
	/unfortunately[,\s]+(?:we )?(?:have )?(?:decided|chosen|selected|determined)/i,
	/regret to inform you/i,
	/after careful review[,\s]+(?:we )?(?:have )?decided/i,

	// Moving forward with someone else (anchored to prevent instructions misuse)
	/decided to (?:move forward|proceed|advancing) with (?:other|another) (?:candidate|applicant|profile)s?/i,
	/(?:moving forward|proceeding) with other (?:candidates|applicants|individuals)/i,

	// Not moving forward with your candidacy (Strictly negative context)
	/will not (?:be )?(?:moving forward|continuing|proceeding) with your (?:candidacy|application)/i,
	/not (?:to |be )?moving forward with your application/i,

	// Position filled or closed
	/position (?:is|has been) (?:now closed|no longer open|filled by another)/i,
	/decided to pursue other applicants/i,

	// Not a match / Not selected
	/not selected to (?:move forward|proceed|continue|interview)/i,
	/decided not to advance your application/i,

	// The "Different Direction" template
	/(?:decided to|going to) (?:go|move) in a different direction/i,

	// The "Better Alignment" template
	/other candidates (?:whose|with) (?:backgrounds?|experience|skills) (?:better|more closely) align/i,

	// The "Volume of Applicants" template (Anchored to application context)
	/(?:due to|given) the (?:high )?volume of (?:applications|candidates|interest).*(?:not selected|unable to move forward|decided)/i,

	// The "Impressive but no" template (Requires anchoring to avoid matching interview praise)
	/(?:while|although) your (?:background|experience) is impressive[,\s]+(?:we )?(?:have )?decided/i,
]

export function isRejectionFormat(text: string): boolean {
	return REJECTION_PATTERNS.some((regex) => regex.test(text))
}
