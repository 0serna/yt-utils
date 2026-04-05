const WATCH_PAGE_HOSTS = new Set(["www.youtube.com", "youtube.com", "m.youtube.com"]);

chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;

  if (!tabId) {
    return;
  }

  await clearActionStatus(tabId);

  try {
    if (!isSupportedWatchPage(tab.url)) {
      throw createExtensionError(
        "UNSUPPORTED_PAGE",
        "Open a standard YouTube watch page before using the extension.",
      );
    }

    const [execution] = await chrome.scripting.executeScript({
      target: { tabId },
      func: runYoutubeMarkAsSeenAutomation,
    });

    const result = execution?.result;

    if (!result?.ok) {
      throw createExtensionError(
        result?.code || "AUTOMATION_FAILED",
        result?.message || "The automation did not complete successfully.",
        result?.details,
      );
    }

    await chrome.tabs.update(tabId, { url: result.redirectUrl });
    await setActionStatus(tabId, {
      text: "OK",
      color: "#2e7d32",
      title: "Video marked as seen.",
    });

    self.setTimeout(() => {
      clearActionStatus(tabId).catch(() => {});
    }, 3000);
  } catch (error) {
    const message = error?.message || "The automation failed.";

    console.error("[mark-as-seen]", error);

    await setActionStatus(tabId, {
      text: "ERR",
      color: "#b71c1c",
      title: message,
    });
  }
});

function isSupportedWatchPage(rawUrl) {
  if (!rawUrl) {
    return false;
  }

  try {
    const url = new URL(rawUrl);
    return WATCH_PAGE_HOSTS.has(url.hostname) && url.pathname === "/watch" && url.searchParams.has("v");
  } catch {
    return false;
  }
}

function createExtensionError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

async function setActionStatus(tabId, { text, color, title }) {
  await chrome.action.setBadgeBackgroundColor({ tabId, color });
  await chrome.action.setBadgeText({ tabId, text });
  await chrome.action.setTitle({ tabId, title });
}

async function clearActionStatus(tabId) {
  await chrome.action.setBadgeText({ tabId, text: "" });
  await chrome.action.setTitle({ tabId, title: "Mark current YouTube video as seen" });
}

async function runYoutubeMarkAsSeenAutomation() {
  const LABELS = {
    share: [/\bshare\b/i, /\bcompartir\b/i],
    copy: [/\bcopy\b/i, /\bcopy link\b/i, /\bcopiar\b/i, /\bcopiar enlace\b/i],
    startAt: [/\bstart at\b/i, /\bempezar en\b/i],
  };

  try {
    if (!window.location.pathname.startsWith("/watch")) {
      throw createAutomationError("UNSUPPORTED_PAGE", "This page is not a standard YouTube watch page.");
    }

    const video = await waitFor(() => document.querySelector("video"), {
      timeout: 15000,
      errorCode: "VIDEO_NOT_FOUND",
      errorMessage: "The YouTube video element was not found.",
    });

    await waitFor(() => Number.isFinite(video.duration) && video.duration > 1, {
      timeout: 15000,
      errorCode: "VIDEO_NOT_READY",
      errorMessage: "The YouTube video metadata never became ready.",
    });

    const targetTime = Math.max(0, Math.min(video.duration - 0.25, video.duration * 0.99));

    video.currentTime = targetTime;

    await waitFor(() => Math.abs(video.currentTime - targetTime) < 1 || video.ended, {
      timeout: 5000,
      interval: 50,
      errorCode: "SEEK_FAILED",
      errorMessage: "The video did not seek to the requested time.",
    });

    video.pause();

    await waitFor(() => video.paused, {
      timeout: 1500,
      interval: 50,
      errorCode: "PAUSE_FAILED",
      errorMessage: "The video could not be paused after seeking.",
    });

    const shareButton = await waitFor(() => findButton(document, LABELS.share), {
      timeout: 10000,
      errorCode: "SHARE_BUTTON_NOT_FOUND",
      errorMessage: "The YouTube Share button could not be found.",
    });

    clickElement(shareButton);

    const shareDialog = await waitFor(findShareDialog, {
      timeout: 10000,
      errorCode: "SHARE_DIALOG_NOT_FOUND",
      errorMessage: "The YouTube share dialog did not open.",
    });

    const startAtCheckbox = await waitFor(() => findStartAtCheckbox(shareDialog, LABELS.startAt), {
      timeout: 10000,
      errorCode: "START_AT_NOT_FOUND",
      errorMessage: "The share dialog did not expose the Start at checkbox.",
    });

    const shareUrlInput = await waitFor(() => findShareUrlInput(shareDialog), {
      timeout: 5000,
      errorCode: "SHARE_URL_NOT_FOUND",
      errorMessage: "The share dialog did not expose the generated URL field.",
    });

    const initialShareUrl = shareUrlInput.value.trim();

    if (!hasStartTime(initialShareUrl)) {
      clickElement(startAtCheckbox);
    }

    await waitFor(() => {
      const value = shareUrlInput.value.trim();
      return Boolean(value) && value.includes("youtu") && hasStartTime(value);
    }, {
      timeout: 5000,
      interval: 50,
      errorCode: "SHARE_URL_NOT_READY",
      errorMessage: "The generated share URL was never updated with the selected start time.",
    });

    const redirectUrl = shareUrlInput.value.trim();
    const copyButton = await waitFor(() => findButton(shareDialog, LABELS.copy), {
      timeout: 5000,
      errorCode: "COPY_BUTTON_NOT_FOUND",
      errorMessage: "The Copy button could not be found in the share dialog.",
    });

    clickElement(copyButton);
    await delay(150);

    return { ok: true, redirectUrl };
  } catch (error) {
    return {
      ok: false,
      code: error?.code || "AUTOMATION_FAILED",
      message: error?.message || "The automation did not complete successfully.",
      details: error?.details || null,
    };
  }

  function createAutomationError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  }

  async function waitFor(getValue, options) {
    const timeout = options?.timeout ?? 5000;
    const interval = options?.interval ?? 100;
    const startedAt = Date.now();

    while (Date.now() - startedAt <= timeout) {
      const value = getValue();

      if (value) {
        return value;
      }

      await delay(interval);
    }

    throw createAutomationError(options?.errorCode || "WAIT_FAILED", options?.errorMessage || "Timed out waiting for the next step.");
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function isVisible(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function getElementLabel(element) {
    const values = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.innerText,
      element.textContent,
    ];

    return values.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  function matchesAnyLabel(element, matchers) {
    const label = getElementLabel(element);
    return matchers.some((matcher) => matcher.test(label));
  }

  function findButton(root, matchers) {
    const elements = root.querySelectorAll("button, [role='button'], tp-yt-paper-checkbox[role='checkbox']");

    return [...elements].find((element) => isVisible(element) && matchesAnyLabel(element, matchers));
  }

  function findShareDialog() {
    const dialogs = document.querySelectorAll("tp-yt-paper-dialog, [role='dialog']");

    return [...dialogs].find((dialog) => {
      if (!isVisible(dialog)) {
        return false;
      }

      return Boolean(findShareUrlInput(dialog)) && Boolean(findButton(dialog, LABELS.copy));
    });
  }

  function findStartAtCheckbox(dialog, matchers) {
    const selectors = [
      "#start-at-checkbox",
      "tp-yt-paper-checkbox[role='checkbox']",
      "input[type='checkbox']",
      "[role='checkbox']",
    ];

    for (const selector of selectors) {
      const candidates = dialog.querySelectorAll(selector);

      for (const candidate of candidates) {
        if (!isVisible(candidate)) {
          continue;
        }

        if (candidate.id === "start-at-checkbox" || matchesAnyLabel(candidate, matchers)) {
          return candidate;
        }
      }
    }

    return null;
  }

  function findShareUrlInput(dialog) {
    const selectors = ["#share-url", "input[readonly]", "input[type='text']"];

    for (const selector of selectors) {
      const candidates = dialog.querySelectorAll(selector);

      for (const candidate of candidates) {
        if (!isVisible(candidate)) {
          continue;
        }

        if (candidate.value && candidate.value.includes("youtu")) {
          return candidate;
        }
      }
    }

    return null;
  }

  function hasStartTime(value) {
    return /(?:[?&](?:t|start)=)/.test(value);
  }

  function clickElement(element) {
    element.scrollIntoView({ block: "center", inline: "center" });
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, button: 0 }));
    element.click();
  }
}
