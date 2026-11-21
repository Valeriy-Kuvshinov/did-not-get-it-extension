/**
 * Every Gmail DOM hook lives here. When Gmail changes its markup, this is the only file to touch.
 * Preference: act / role / aria / data-* attributes first, Gmail's obfuscated classes second.
 * Entries marked (EN) match English UI text and break in other UI languages.
 */
export const GMAIL_DOM = {
	// Message list
	row: 'tr.zA[role="row"]',
	unreadRowClass: "zE",
	rowCheckbox: 'div[role="checkbox"]',
	threadId: "span[data-legacy-thread-id]",
	threadIdAttr: "data-legacy-thread-id",
	subject: ".bog",
	snippet: ".y2",
	labelChip: ".at[title]",

	// Main toolbar above the list
	toolbar: '[gh="mtb"]',
	markAsReadBtn: '[role="button"][act="1"]',
	labelsBtn: '[role="button"][data-tooltip="Labels"]', // (EN)
	moreBtn: '[role="button"][data-tooltip="More"]', // (EN)
	selectAllCheckbox: 'span[role="checkbox"]',

	// Menus
	menu: '[role="menu"]',
	submenuItem: '[role="menuitem"].J-Ph',
	labelItem: '[role="menuitemcheckbox"]',
	createLabelItem: '[role="menuitem"][act="14"]',
	addCustomColorItem: '[data-grid-width] + [role="menuitem"]',
	colorSwatch: '[role="gridcell"] > [title]',

	// Sidebar
	sidebar: '[role="navigation"]',
	sidebarCollapsedClass: "bhZ",
	sidebarSlidOpenClass: "bym",
	sidebarSlidingClass: "aaj",
	sidebarLabelBtn: '[role="button"][data-label-name]',

	// Dialogs ("New label", "Add custom color")
	dialog: '[aria-modal="true"]',
	dialogInput: 'input[type="text"]',
	dialogOkBtn: 'button[data-mdc-dialog-action="ok"]',
	dialogCancelBtn: 'button[data-mdc-dialog-action="cancel"]',
} as const
