import markAsSeenFeature from "./features/mark-as-seen/content";
import audioLanguageSubtitlePolicyFeature from "./features/audio-language-subtitle-policy/content";
import playbackSpeedFeature from "./features/playback-speed/content";
import { FeatureRegistry } from "./shared/feature-registry";

const registry = new FeatureRegistry();
registry.register(markAsSeenFeature);
registry.register(audioLanguageSubtitlePolicyFeature);
registry.register(playbackSpeedFeature);
