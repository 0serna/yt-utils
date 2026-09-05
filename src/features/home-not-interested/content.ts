import { createFeedCardOverlayActionFeature } from "@shared/feed-card-overlay-action";
import {
  findNotInterestedMenuItem,
  isDesktopHomePage,
} from "@shared/youtube-dom";

export default createFeedCardOverlayActionFeature({
  name: "home-not-interested",
  matchesPage: isDesktopHomePage,
  idPrefix: "yt-utils-home-not-interested",
  buttonLabel: "No me interesa",
  pendingLabel: "No me interesa...",
  icon: "eye-slash",
  findMenuItem: findNotInterestedMenuItem,
  actionUnavailableCode: "NOT_INTERESTED_ACTION_UNAVAILABLE",
  actionUnavailableMessage: "The native Not interested action did not appear.",
  placementFailureMessage:
    "Home not-interested controls could not find a thumbnail placement surface.",
});
