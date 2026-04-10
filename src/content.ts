import { FeatureRegistry } from "./shared/feature-registry";
import markAsSeenFeature from "./features/mark-as-seen/content";
import playbackSpeedFeature from "./features/playback-speed/content";

const registry = new FeatureRegistry();
registry.register(markAsSeenFeature);
registry.register(playbackSpeedFeature);