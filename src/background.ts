import { registerGoogleSearchHandler } from "./features/global-selection-search/background";
import { registerMarkAsSeenHandler } from "./features/mark-as-seen/background";

registerMarkAsSeenHandler();
registerGoogleSearchHandler();
