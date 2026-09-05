import { createFeedCardOverlayActionFeature } from "@shared/feed-card-overlay-action";
import {
  findHideMenuItem,
  isDesktopSubscriptionsFeedPage,
} from "@shared/youtube-dom";

export default createFeedCardOverlayActionFeature({
  name: "youtube-subscriptions-feed-controls",
  matchesPage: isDesktopSubscriptionsFeedPage,
  idPrefix: "yt-utils-subscriptions-hide",
  buttonLabel: "Hide",
  pendingLabel: "Hiding...",
  icon: "x",
  findMenuItem: findHideMenuItem,
  actionUnavailableCode: "HIDE_ACTION_UNAVAILABLE",
  actionUnavailableMessage: "The native Hide action did not appear.",
  placementFailureMessage:
    "Subscriptions hide controls could not find a thumbnail placement surface.",
});
