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
const DEFAULT_BUTTON_OPTIONS: Required<ExtensionButtonStyleOptions> = {
  background: DEFAULT_BUTTON_BACKGROUND,
  hoverBackground: DEFAULT_BUTTON_HOVER_BACKGROUND,
  activeBackground: "",
  color: DEFAULT_BUTTON_COLOR,
  opacity: "1",
  cursor: "pointer",
  transition: DEFAULT_BUTTON_TRANSITION,
  position: "",
  zIndex: "",
  pointerEvents: "auto",
};

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
  const styles = readButtonStyleConfig(options);

  Object.assign(button.style, {
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    cursor: styles.cursor,
    backgroundColor: styles.background,
    backgroundImage: BUTTON_SURFACE_HIGHLIGHT,
    backgroundRepeat: "no-repeat",
    backgroundOrigin: "border-box",
    color: styles.color,
    opacity: styles.opacity,
    fontFamily: "inherit",
    fontSize: "18px",
    fontWeight: "600",
    lineHeight: "1",
    pointerEvents: styles.pointerEvents,
    transition: styles.transition,
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
  });

  buttonInteractionStyles.set(button, {
    background: styles.background,
    hoverBackground: styles.hoverBackground,
    activeBackground: styles.activeBackground,
  });

  applyOptionalStyle(button.style, "position", options.position);
  applyOptionalStyle(button.style, "zIndex", options.zIndex);

  bindInteractionStyles(button);
}

function readButtonStyleConfig(
  options: ExtensionButtonStyleOptions,
): Required<ExtensionButtonStyleOptions> {
  const styles = { ...DEFAULT_BUTTON_OPTIONS, ...options };
  styles.activeBackground = readActiveBackground(styles);
  return styles;
}

function readActiveBackground(
  styles: Required<ExtensionButtonStyleOptions>,
): string {
  return styles.activeBackground || styles.hoverBackground;
}

function applyOptionalStyle(
  style: CSSStyleDeclaration,
  property: "position" | "zIndex",
  value: string | undefined,
): void {
  if (value) {
    style[property] = value;
  }
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
