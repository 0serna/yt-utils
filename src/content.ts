import askAutoOpenFeature from "./features/ask-auto-open/content";
import audioLanguageSubtitlePolicyFeature from "./features/audio-language-subtitle-policy/content";
import engagementPanelScrollContainmentFeature from "./features/engagement-panel-scroll-containment/content";
import markAsSeenFeature from "./features/mark-as-seen/content";
import playbackSpeedFeature from "./features/playback-speed/content";
import subscriptionsHideFeature from "./features/subscriptions-hide/content";
import { FeatureRegistry } from "./shared/feature-registry";

const registry = new FeatureRegistry();
registry.register(markAsSeenFeature);
registry.register(audioLanguageSubtitlePolicyFeature);
registry.register(playbackSpeedFeature);
registry.register(engagementPanelScrollContainmentFeature);
registry.register(askAutoOpenFeature);
registry.register(subscriptionsHideFeature);
