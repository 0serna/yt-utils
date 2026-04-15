type BootstrapIconName = "plus" | "dash" | "check";

const ICON_PATHS: Record<BootstrapIconName, string> = {
	plus: '<path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>',
	dash: '<path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>',
	check:
		'<path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>',
};

export function getBootstrapIconMarkup(name: BootstrapIconName): string {
	return [
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false">',
		ICON_PATHS[name],
		"</svg>",
	].join("");
}
