import {
  createDomSyncController,
  hasRelevantSurfaceMutation,
} from "@shared/dom-sync-controller";
import type { Feature, FeatureContext } from "@shared/types";
import {
  clickElement,
  delay,
  findButton,
  isVisible,
  waitFor,
} from "@shared/youtube-dom";
import {
  createWatchSessionController,
  getCurrentWatchVideoId,
  type WatchSession,
} from "@shared/youtube-session";

const PANEL_TARGET_ID = "PAyouchat";
const CHAPTERS_PANEL_TARGET_IDS = [
  "engagement-panel-macro-markers",
  "engagement-panel-macro-markers-description-chapters",
];
const ASK_SCROLL_CONTAINER_SELECTOR =
  'ytd-engagement-panel-section-list-renderer[target-id="PAyouchat"] yt-section-list-renderer';
const POLL_INTERVAL_MS = 500;
const SYNC_TIMEOUT_MS = 5000;
const PANEL_SETTLE_DELAY_MS = 1500;
const VIDEO_WATCH_INTERVAL_MS = 500;
const ASK_LABELS = [/\bask\b/i, /\bpreguntar\b/i];
const CHAPTERS_LABELS = [/\bchapters\b/i, /\bcapítulos\b/i];
const NOISY_COMPOSITE_PANEL_LABELS = [/\bin this video\b/i, /\btimeline\b/i];
const NOISY_TRANSCRIPT_LABEL = /\btranscript\b/i;
const LIVE_CHAT_REPLAY_LABEL = /\blive chat replay\b/i;
const CLOSE_LABELS = [
  /^close$/i,
  /\bclose panel\b/i,
  /^cerrar$/i,
  /^hide chat replay$/i,
  /\bocultar\b.*\bchat\b/i,
];
const CHAPTER_ITEM_SELECTOR = "ytd-macro-markers-list-item-renderer";
const CHAT_INPUT_SELECTOR =
  'textarea.chatInputViewModelChatInput, textarea[placeholder="Ask a question..."], textarea[placeholder="Haz una pregunta..."]';
const SEND_BUTTON_SELECTOR = 'button[aria-label="Send"]';
const SUMMARIZE_PROMPT =
  "Summarize this video chronologically with timestamped bullets, then the key takeaways.";
const ASK_SCROLL_OVERSCROLL_BEHAVIOR = "contain";

const watchSessions = createWatchSessionController();
let completedVideoId: string | null = null;
let promptedVideoId: string | null = null;
let promptingVideoId: string | null = null;
let expandedVideoId: string | null = null;
let closedNoisyPanels = new WeakSet<HTMLElement>();
let activatedAt = 0;
let observedVideoId: string | null = null;
let videoWatchTimer: number | null = null;

const domSyncController = createDomSyncController({
  pollIntervalMs: POLL_INTERVAL_MS,
  observerOptions: {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ["visibility", "hidden", "aria-hidden", "class", "style"],
  },
  hasRelevantMutation: (mutations) =>
    hasRelevantSurfaceMutation(mutations, isInsidePanelSurface),
  sync: () => watchSessions.run(syncCurrentVideoPanel),
});

const watchPanelAutoOpenFeature: Feature = {
  name: "youtube-watch-panel-auto-open",
  isWatchPage: true,

  activate(_context: FeatureContext): void {
    resetSessionState();
    observedVideoId = getCurrentWatchVideoId();
    syncAskScrollContainment();
    watchSessions.activate();
    domSyncController.activate();
    startVideoWatch();
  },

  deactivate(): void {
    watchSessions.deactivate();
    domSyncController.deactivate();
    resetSessionState();
    observedVideoId = null;
    stopVideoWatch();
  },
};

export default watchPanelAutoOpenFeature;

function startVideoWatch(): void {
  if (videoWatchTimer !== null) {
    return;
  }

  videoWatchTimer = window.setInterval(() => {
    syncObservedVideoId();
  }, VIDEO_WATCH_INTERVAL_MS);
}

function stopVideoWatch(): void {
  if (videoWatchTimer !== null) {
    window.clearInterval(videoWatchTimer);
    videoWatchTimer = null;
  }
}

function syncObservedVideoId(): void {
  const currentVideoId = getCurrentWatchVideoId();
  if (currentVideoId === observedVideoId) {
    return;
  }

  observedVideoId = currentVideoId;
  resetSessionState();
  watchSessions.activate();
  domSyncController.activate();
}

function resetSessionState(): void {
  activatedAt = Date.now();
  completedVideoId = null;
  promptedVideoId = null;
  promptingVideoId = null;
  expandedVideoId = null;
  closedNoisyPanels = new WeakSet<HTMLElement>();
}

function findAskPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `ytd-engagement-panel-section-list-renderer[target-id="${PANEL_TARGET_ID}"]`,
  );
}

function findChaptersPanel(): HTMLElement | null {
  return findChaptersPanelByTargetId() ?? findChaptersPanelByLabel();
}

function findChaptersPanelByTargetId(): HTMLElement | null {
  for (const targetId of CHAPTERS_PANEL_TARGET_IDS) {
    const panel = document.querySelector<HTMLElement>(
      `ytd-engagement-panel-section-list-renderer[target-id="${targetId}"]`,
    );
    if (panel) {
      return panel;
    }
  }

  return null;
}

function findChaptersPanelByLabel(): HTMLElement | null {
  const panels = document.querySelectorAll<HTMLElement>(
    "ytd-engagement-panel-section-list-renderer",
  );

  return (
    [...panels].find((panel) => {
      const text = panel.textContent || "";
      return (
        CHAPTERS_LABELS.some((re) => re.test(text)) &&
        Boolean(panel.querySelector(CHAPTER_ITEM_SELECTOR))
      );
    }) ?? null
  );
}

function isAskPanelExpanded(panel: HTMLElement): boolean {
  const visibility = panel.getAttribute("visibility");

  if (visibility === "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED") {
    return true;
  }

  if (visibility === "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN") {
    return false;
  }

  return isVisible(panel);
}

function findVisibleChapterItems(): HTMLElement[] {
  const panel = findChaptersPanel();
  if (!panel) return [];

  return [...panel.querySelectorAll<HTMLElement>(CHAPTER_ITEM_SELECTOR)].filter(
    isVisible,
  );
}

function findChaptersButton(): HTMLElement | null {
  return findButton(document, CHAPTERS_LABELS);
}

function findAskButton(): HTMLElement | null {
  const entrypoint = document.querySelector<HTMLElement>(
    "button-view-model.you-chat-entrypoint-button button, yt-button-view-model button[aria-label='Ask'], yt-button-view-model button[aria-label='Preguntar']",
  );

  if (entrypoint && isVisible(entrypoint)) {
    return entrypoint;
  }

  return findButton(document, ASK_LABELS);
}

async function syncCurrentVideoPanel(session: WatchSession): Promise<void> {
  const snapshot = await session.readSnapshot();
  if (!snapshot || !session.isCurrent()) return;

  await syncValidatedVideoPanel(session.videoId, session);
}

async function syncValidatedVideoPanel(
  videoId: string,
  session: WatchSession,
): Promise<void> {
  if (!session.isCurrent()) return;
  const askState = readAskPanelState();

  if (!prepareVideoState(videoId, askState.expanded)) {
    return;
  }

  if (
    (await handleAlreadyExpandedAsk(videoId, session, askState.expanded)) ||
    !session.isCurrent()
  ) {
    return;
  }

  closeNoisyPanels(videoId, session);

  syncCollapsedAskPanelScrollContainment(askState.panel, askState.expanded);

  if (await handledAskOrLostSession(videoId, session)) {
    return;
  }

  closeNoisyPanels(videoId, session);

  await tryOpenChapters(videoId, session);
}

function readAskPanelState(): { panel: HTMLElement | null; expanded: boolean } {
  const panel = findAskPanel();
  return { panel, expanded: panel ? isAskPanelExpanded(panel) : false };
}

function prepareVideoState(videoId: string, askExpanded: boolean): boolean {
  resetStaleState(videoId);
  return (
    completedVideoId !== videoId ||
    shouldPromptExpandedAsk(videoId, askExpanded)
  );
}

async function handleAlreadyExpandedAsk(
  videoId: string,
  session: WatchSession,
  askExpanded: boolean,
): Promise<boolean> {
  if (shouldDeferInitialExpandedAsk(videoId, askExpanded)) {
    return true;
  }

  if (shouldPromptExpandedAsk(videoId, askExpanded)) {
    await promptCurrentVideo(videoId, session);
    if (!session.isCurrent()) {
      return true;
    }
    completeVideo(videoId);
    return true;
  }

  if (expandedVideoId !== videoId) {
    return false;
  }

  completeVideo(videoId);
  return true;
}

async function handledAskOrLostSession(
  videoId: string,
  session: WatchSession,
): Promise<boolean> {
  const askHandled = await tryOpenAsk(videoId, session);
  return !session.isCurrent() || askHandled;
}

function shouldPromptExpandedAsk(
  videoId: string,
  askExpanded: boolean,
): boolean {
  return (
    askExpanded && promptedVideoId !== videoId && promptingVideoId !== videoId
  );
}

function syncCollapsedAskPanelScrollContainment(
  panel: HTMLElement | null,
  askExpanded: boolean,
): void {
  if (panel && !askExpanded) {
    syncAskScrollContainment();
  }
}

function closeNoisyPanels(videoId: string, session: WatchSession): void {
  if (!session.isCurrent() || completedVideoId === videoId) {
    return;
  }

  for (const panel of findNoisyExpandedPanels()) {
    if (!session.isCurrent() || completedVideoId === videoId) {
      return;
    }

    const closeControl = findVisibleCloseControl(panel);
    if (closeControl) {
      closedNoisyPanels.add(panel);
      clickElement(closeControl);
    }
  }

  for (const iframe of findNoisyLiveChatReplayIframes()) {
    if (!session.isCurrent() || completedVideoId === videoId) {
      return;
    }

    const closeControl = findVisibleLiveChatReplayIframeCloseControl(iframe);
    if (closeControl) {
      closedNoisyPanels.add(iframe);
      clickElement(closeControl);
    }
  }
}

function findNoisyExpandedPanels(): HTMLElement[] {
  return [
    ...findNoisyExpandedEngagementPanels(),
    ...findNoisyLiveChatReplayFrames(),
    ...findNoisyLiveChatHeaders(),
  ];
}

function findNoisyExpandedEngagementPanels(): HTMLElement[] {
  const panels = document.querySelectorAll<HTMLElement>(
    "ytd-engagement-panel-section-list-renderer",
  );

  return [...panels].filter(
    (panel) =>
      !closedNoisyPanels.has(panel) &&
      isAskPanelExpanded(panel) &&
      hasNoisyPanelLabel(panel),
  );
}

function findNoisyLiveChatReplayFrames(): HTMLElement[] {
  const frames = document.querySelectorAll<HTMLElement>("ytd-live-chat-frame");

  return [...frames].filter(
    (frame) =>
      !closedNoisyPanels.has(frame) && Boolean(findVisibleCloseControl(frame)),
  );
}

function findNoisyLiveChatHeaders(): HTMLElement[] {
  const headers = document.querySelectorAll<HTMLElement>(
    "yt-live-chat-header-renderer",
  );

  return [...headers].filter(
    (header) =>
      !closedNoisyPanels.has(header) &&
      Boolean(findVisibleCloseControl(header)),
  );
}

function findNoisyLiveChatReplayIframes(): HTMLIFrameElement[] {
  const iframes = document.querySelectorAll<HTMLIFrameElement>(
    "iframe#chatframe, iframe[name='chatframe']",
  );

  return [...iframes].filter(
    (iframe) =>
      !closedNoisyPanels.has(iframe) &&
      isLiveChatReplayIframe(iframe) &&
      Boolean(findVisibleLiveChatReplayIframeCloseControl(iframe)),
  );
}

function isLiveChatReplayIframe(iframe: HTMLIFrameElement): boolean {
  return (
    /\/live_chat_replay\b/.test(iframe.src) ||
    /\/live_chat_replay\b/.test(readIframeLocationHref(iframe) || "") ||
    iframe.id === "chatframe" ||
    iframe.name === "chatframe"
  );
}

function readIframeLocationHref(iframe: HTMLIFrameElement): string | null {
  try {
    return iframe.contentWindow?.location.href || null;
  } catch {
    return null;
  }
}

function findVisibleLiveChatReplayIframeCloseControl(
  iframe: HTMLIFrameElement,
): HTMLElement | null {
  const iframeDocument = readIframeDocument(iframe);
  if (!iframeDocument) {
    return null;
  }

  const closeButton = findButton(iframeDocument, CLOSE_LABELS);
  if (closeButton && isVisible(closeButton)) {
    return closeButton;
  }

  return null;
}

function readIframeDocument(iframe: HTMLIFrameElement): Document | null {
  try {
    return iframe.contentDocument;
  } catch {
    return null;
  }
}

function hasNoisyPanelLabel(panel: HTMLElement): boolean {
  const text = panel.textContent || "";
  const hasCompositeLabel = NOISY_COMPOSITE_PANEL_LABELS.some((re) =>
    re.test(text),
  );

  return (
    LIVE_CHAT_REPLAY_LABEL.test(text) ||
    hasCompositeLabel ||
    (NOISY_TRANSCRIPT_LABEL.test(text) && hasCompositeLabel)
  );
}

function findVisibleCloseControl(panel: HTMLElement): HTMLElement | null {
  const closeButton = findButton(panel, CLOSE_LABELS);
  if (closeButton && isVisible(closeButton)) {
    return closeButton;
  }

  return null;
}

function shouldDeferInitialExpandedAsk(
  videoId: string,
  askExpanded: boolean,
): boolean {
  if (!askExpanded) {
    return false;
  }

  syncAskScrollContainment();
  return (
    expandedVideoId !== videoId &&
    Date.now() - activatedAt < PANEL_SETTLE_DELAY_MS
  );
}

function resetStaleState(videoId: string): void {
  completedVideoId = resetVideoStateValue(completedVideoId, videoId);
  promptedVideoId = resetVideoStateValue(promptedVideoId, videoId);
  promptingVideoId = resetVideoStateValue(promptingVideoId, videoId);
  expandedVideoId = resetVideoStateValue(expandedVideoId, videoId);
}

function resetVideoStateValue(
  stateVideoId: string | null,
  currentVideoId: string,
): string | null {
  return stateVideoId && stateVideoId !== currentVideoId ? null : stateVideoId;
}

function completeVideo(videoId: string): void {
  expandedVideoId = videoId;
  completedVideoId = videoId;
}

async function tryOpenChapters(
  videoId: string,
  session: WatchSession,
): Promise<boolean> {
  if (!session.isCurrent()) return false;
  if (completeIfChaptersAlreadyOpen(videoId)) {
    return true;
  }

  const chaptersButton = findChaptersButton();
  if (!chaptersButton) {
    return false;
  }

  clickElement(chaptersButton);
  return completeWhenChaptersOpen(videoId, session);
}

async function completeWhenChaptersOpen(
  videoId: string,
  session: WatchSession,
): Promise<boolean> {
  if (!(await waitForVisibleChapterItems())) {
    return false;
  }

  if (!session.isCurrent()) {
    return false;
  }

  completeVideo(videoId);
  return true;
}

function completeIfChaptersAlreadyOpen(videoId: string): boolean {
  if (!hasExpandedChaptersItems()) {
    return false;
  }

  completeVideo(videoId);
  return true;
}

function hasExpandedChaptersItems(): boolean {
  const chaptersPanel = findChaptersPanel();
  return Boolean(
    chaptersPanel &&
      isAskPanelExpanded(chaptersPanel) &&
      findVisibleChapterItems().length > 0,
  );
}

async function waitForVisibleChapterItems(): Promise<boolean> {
  try {
    await waitFor(
      () => {
        const items = findVisibleChapterItems();
        return items.length > 0 ? items : null;
      },
      {
        timeout: SYNC_TIMEOUT_MS,
        interval: 100,
        errorCode: "CHAPTERS_NOT_AVAILABLE",
        errorMessage: "Timed out waiting for chapters panel to show items.",
      },
    );
    return true;
  } catch {
    return false;
  }
}

async function tryOpenAsk(
  videoId: string,
  session: WatchSession,
): Promise<boolean> {
  if (await completeExpandedAskIfOpen(videoId, session)) {
    return true;
  }

  const askControl = await waitForAskButtonOrExpandedPanel();
  if (!askControl) {
    return false;
  }

  if (await completeExpandedAskIfOpen(videoId, session)) {
    return true;
  }

  if (!session.isCurrent()) {
    return false;
  }

  clickElement(askControl);
  return completeWhenAskPanelOpen(videoId, session);
}

async function completeWhenAskPanelOpen(
  videoId: string,
  session: WatchSession,
): Promise<boolean> {
  if (!(await waitForExpandedAskPanel())) {
    return false;
  }

  return completeExpandedAsk(videoId, session);
}

async function completeExpandedAskIfOpen(
  videoId: string,
  session: WatchSession,
): Promise<boolean> {
  if (!isAskPanelCurrentlyExpanded()) {
    return false;
  }

  return completeExpandedAsk(videoId, session);
}

async function completeExpandedAsk(
  videoId: string,
  session: WatchSession,
): Promise<boolean> {
  if (!session.isCurrent()) {
    return false;
  }

  await promptCurrentVideo(videoId, session);

  await delay(PANEL_SETTLE_DELAY_MS);

  if (!session.isCurrent()) return false;
  if (!isAskPanelCurrentlyExpanded()) {
    domSyncController.queueSync();
    return false;
  }

  completeVideo(videoId);
  syncAskScrollContainment();
  return true;
}

async function waitForAskButtonOrExpandedPanel(): Promise<HTMLElement | null> {
  const immediateAskButton = findAskButton();
  if (immediateAskButton) {
    return immediateAskButton;
  }

  try {
    return await waitFor(
      () => {
        if (isAskPanelCurrentlyExpanded()) {
          return findAskPanel();
        }

        return findAskButton();
      },
      {
        timeout: SYNC_TIMEOUT_MS,
        interval: 100,
        errorCode: "ASK_NOT_AVAILABLE",
        errorMessage: "Timed out waiting for Ask to become available.",
      },
    );
  } catch {
    return null;
  }
}

async function promptCurrentVideo(
  videoId: string,
  session: WatchSession,
): Promise<void> {
  if (
    !session.isCurrent() ||
    promptedVideoId === videoId ||
    promptingVideoId === videoId
  ) {
    return;
  }

  promptingVideoId = videoId;
  await typeAndSendPrompt(session);
  if (session.isCurrent()) {
    promptedVideoId = videoId;
    promptingVideoId = null;
  }
}

function isAskPanelCurrentlyExpanded(): boolean {
  const panel = findAskPanel();
  return Boolean(panel && isAskPanelExpanded(panel));
}

async function waitForExpandedAskPanel(): Promise<boolean> {
  try {
    await waitFor(
      () => {
        const currentPanel = findAskPanel();
        return currentPanel && isAskPanelExpanded(currentPanel)
          ? currentPanel
          : null;
      },
      {
        timeout: SYNC_TIMEOUT_MS,
        interval: 100,
        errorCode: "ASK_PANEL_NOT_OPENED",
        errorMessage: "Timed out waiting for the Ask panel to open.",
      },
    );
    return true;
  } catch {
    return false;
  }
}

function findChatInput(): HTMLElement | null {
  const askPanel = findAskPanel();
  if (!askPanel) return null;
  return askPanel.querySelector<HTMLElement>(CHAT_INPUT_SELECTOR);
}

function findSendButton(): HTMLElement | null {
  const askPanel = findAskPanel();
  if (!askPanel) return null;
  return askPanel.querySelector<HTMLElement>(SEND_BUTTON_SELECTOR);
}

async function typeAndSendPrompt(session: WatchSession): Promise<void> {
  try {
    const input = await waitFor(
      () => {
        const el = findChatInput();
        return el && isVisible(el) ? el : null;
      },
      {
        timeout: SYNC_TIMEOUT_MS,
        interval: 100,
        errorCode: "CHAT_INPUT_NOT_FOUND",
        errorMessage: "Timed out waiting for chat input.",
      },
    );

    const sendButton = findSendButton();
    if (!sendButton || !session.isCurrent()) {
      return;
    }

    input.focus();

    typePromptText(input);

    if (!session.isCurrent()) {
      return;
    }

    clickElement(sendButton);
  } catch {
    // Intentionally silent: chat input or send button unavailable.
  }
}

function syncAskScrollContainment(): void {
  const scrollContainer = document.querySelector<HTMLElement>(
    ASK_SCROLL_CONTAINER_SELECTOR,
  );

  if (!scrollContainer) {
    return;
  }

  if (
    scrollContainer.style.overscrollBehaviorY !== ASK_SCROLL_OVERSCROLL_BEHAVIOR
  ) {
    scrollContainer.style.overscrollBehaviorY = ASK_SCROLL_OVERSCROLL_BEHAVIOR;
  }
}

function typePromptText(input: HTMLElement): void {
  const textInput = getTextInput(input);
  resetPromptInput(input, textInput);

  for (const character of SUMMARIZE_PROMPT) {
    dispatchPromptKeyEvent(input, "keydown", character);
    dispatchPromptKeyEvent(input, "keypress", character);
    appendPromptCharacter(input, textInput, character);
    input.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: character,
      }),
    );
    dispatchPromptKeyEvent(input, "keyup", character);
  }
}

function resetPromptInput(
  input: HTMLElement,
  textInput: HTMLInputElement | HTMLTextAreaElement | null,
): void {
  if (textInput) {
    textInput.value = "";
    return;
  }

  input.textContent = "";
}

function dispatchPromptKeyEvent(
  input: HTMLElement,
  type: "keydown" | "keypress" | "keyup",
  key: string,
): void {
  input.dispatchEvent(
    new KeyboardEvent(type, {
      key,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function appendPromptCharacter(
  input: HTMLElement,
  textInput: HTMLInputElement | HTMLTextAreaElement | null,
  character: string,
): void {
  if (textInput) {
    textInput.value += character;
    return;
  }

  input.textContent = `${input.textContent || ""}${character}`;
}

function getTextInput(
  input: HTMLElement,
): HTMLInputElement | HTMLTextAreaElement | null {
  if (
    input instanceof HTMLInputElement ||
    input instanceof HTMLTextAreaElement
  ) {
    return input;
  }

  return null;
}

function isInsidePanelSurface(node: Node): boolean {
  if (!(node instanceof Element)) {
    return false;
  }

  return Boolean(
    node.closest(
      `ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, ytd-menu-renderer, ytd-engagement-panel-section-list-renderer, ytd-live-chat-frame, yt-live-chat-header-renderer`,
    ),
  );
}
