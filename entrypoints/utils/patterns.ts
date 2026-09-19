const REJECTION_PATTERNS: RegExp[] = [
	/regret to inform you/i,
	/decided to move forward with other/i,
	/not (be )?moving forward/i,
	/pursuing other candidates/i,
	/position is no longer open/i,
	/will not be advancing/i,
	/other candidates whose (qualifications|skills|experience)/i,
	/careful review of all candidates/i,
	/have chosen to pursue/i,
	/unfortunately, .* no longer open/i,
]

export function isRejection(text: string): boolean {
	return REJECTION_PATTERNS.some((regex) => regex.test(text))
}
