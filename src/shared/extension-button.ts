type ExtensionButtonStyleOptions = {
	background?: string;
	hoverBackground?: string;
	activeBackground?: string;
	color?: string;
	opacity?: string;
	cursor?: string;
	transition?: string;
	position?: string;
	zIndex?: string;
	pointerEvents?: string;
};

const DEFAULT_BUTTON_BACKGROUND = "rgba(255, 255, 255, 0.1)";
const DEFAULT_BUTTON_HOVER_BACKGROUND = "rgba(255, 255, 255, 0.2)";
const DEFAULT_BUTTON_COLOR = "var(--yt-spec-text-primary, #f1f1f1)";
const DEFAULT_BUTTON_TRANSITION =
	"background-color 120ms ease, color 120ms ease, opacity 120ms ease";
const BUTTON_SURFACE_HIGHLIGHT =
	"linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 42%, rgba(255, 255, 255, 0) 100%)";

const boundButtons = new WeakSet<HTMLButtonElement>();
const buttonInteractionStyles = new WeakMap<
	HTMLButtonElement,
	{
		background: string;
		hoverBackground: string;
		activeBackground: string;
	}
>();

export function applyExtensionButtonStyles(
	button: HTMLButtonElement,
	options: ExtensionButtonStyleOptions = {},
): void {
	const background = options.background ?? DEFAULT_BUTTON_BACKGROUND;
	const hoverBackground =
		options.hoverBackground ?? DEFAULT_BUTTON_HOVER_BACKGROUND;
	const activeBackground = options.activeBackground ?? hoverBackground;

	button.style.width = "36px";
	button.style.height = "36px";
	button.style.border = "none";
	button.style.borderRadius = "18px";
	button.style.display = "inline-flex";
	button.style.alignItems = "center";
	button.style.justifyContent = "center";
	button.style.padding = "0";
	button.style.cursor = options.cursor ?? "pointer";
	button.style.backgroundColor = background;
	button.style.backgroundImage = BUTTON_SURFACE_HIGHLIGHT;
	button.style.backgroundRepeat = "no-repeat";
	button.style.backgroundOrigin = "border-box";
	button.style.color = options.color ?? DEFAULT_BUTTON_COLOR;
	button.style.opacity = options.opacity ?? "1";
	button.style.fontFamily = "inherit";
	button.style.fontSize = "18px";
	button.style.fontWeight = "600";
	button.style.lineHeight = "1";
	button.style.pointerEvents = options.pointerEvents ?? "auto";
	button.style.transition = options.transition ?? DEFAULT_BUTTON_TRANSITION;
	button.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.04)";

	buttonInteractionStyles.set(button, {
		background,
		hoverBackground,
		activeBackground,
	});

	if (options.position) {
		button.style.position = options.position;
	}

	if (options.zIndex) {
		button.style.zIndex = options.zIndex;
	}

	bindInteractionStyles(button);
}

function bindInteractionStyles(button: HTMLButtonElement): void {
	if (boundButtons.has(button)) {
		return;
	}

	boundButtons.add(button);

	button.addEventListener("mouseenter", () => {
		if (button.disabled) {
			return;
		}

		button.style.backgroundColor = getInteractionStyles(button).hoverBackground;
	});

	button.addEventListener("mouseleave", () => {
		button.style.backgroundColor = getInteractionStyles(button).background;
	});

	button.addEventListener("mousedown", () => {
		if (button.disabled) {
			return;
		}

		button.style.backgroundColor =
			getInteractionStyles(button).activeBackground;
	});

	button.addEventListener("mouseup", () => {
		if (button.matches(":hover") && !button.disabled) {
			button.style.backgroundColor =
				getInteractionStyles(button).hoverBackground;
			return;
		}

		button.style.backgroundColor = getInteractionStyles(button).background;
	});

	button.addEventListener("blur", () => {
		button.style.backgroundColor = getInteractionStyles(button).background;
	});
}

function getInteractionStyles(button: HTMLButtonElement): {
	background: string;
	hoverBackground: string;
	activeBackground: string;
} {
	return (
		buttonInteractionStyles.get(button) ?? {
			background: DEFAULT_BUTTON_BACKGROUND,
			hoverBackground: DEFAULT_BUTTON_HOVER_BACKGROUND,
			activeBackground: DEFAULT_BUTTON_HOVER_BACKGROUND,
		}
	);
}
