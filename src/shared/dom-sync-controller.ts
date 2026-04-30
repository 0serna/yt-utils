type DomSyncControllerOptions = {
  pollIntervalMs: number;
  observerOptions: MutationObserverInit;
  hasRelevantMutation: (mutations: MutationRecord[]) => boolean;
  sync: (token: number) => Promise<void> | void;
};

export type DomSyncController = {
  activate: () => number;
  deactivate: () => number;
  queueSync: () => void;
};

export function hasRelevantSurfaceMutation(
  mutations: MutationRecord[],
  isInsideSurface: (node: Node) => boolean,
): boolean {
  return mutations.some((mutation) => {
    if (!(mutation.target instanceof Element)) {
      return false;
    }

    if (isInsideSurface(mutation.target)) {
      return true;
    }

    return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
      if (!(node instanceof Element)) {
        return false;
      }

      return isInsideSurface(node);
    });
  });
}

export function createDomSyncController(
  options: DomSyncControllerOptions,
): DomSyncController {
  let observer: MutationObserver | null = null;
  let pollTimer: number | null = null;
  let frameQueued = false;
  let syncInProgress = false;
  let sessionToken = 0;
  let active = false;

  function activate(): number {
    sessionToken += 1;
    active = true;
    startPolling();
    observePage();
    queueSync();
    return sessionToken;
  }

  function deactivate(): number {
    sessionToken += 1;
    active = false;
    stopPolling();
    stopObserving();
    return sessionToken;
  }

  function startPolling(): void {
    if (pollTimer !== null) {
      return;
    }

    pollTimer = window.setInterval(() => {
      queueSync();
    }, options.pollIntervalMs);
  }

  function stopPolling(): void {
    if (pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function observePage(): void {
    if (observer) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      if (!options.hasRelevantMutation(mutations)) {
        return;
      }

      queueAnimationFrameSync();
    });

    observer.observe(document.documentElement, options.observerOptions);
  }

  function stopObserving(): void {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function queueAnimationFrameSync(): void {
    if (frameQueued) {
      return;
    }

    frameQueued = true;

    window.requestAnimationFrame(() => {
      frameQueued = false;
      queueSync();
    });
  }

  function queueSync(): void {
    if (!active || syncInProgress) {
      return;
    }

    const token = sessionToken;
    syncInProgress = true;
    void Promise.resolve(options.sync(token)).finally(() => {
      syncInProgress = false;
    });
  }

  return { activate, deactivate, queueSync };
}
