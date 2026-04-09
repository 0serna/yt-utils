import { FeatureRegistry } from "./shared/feature-registry";
import markAsSeenFeature from "./features/mark-as-seen/content";

const registry = new FeatureRegistry();
registry.register(markAsSeenFeature);