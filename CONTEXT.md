# yt-utils

Domain language for the YouTube desktop extension and its feed/content features.

## Language

**Home**:
The desktop YouTube landing feed at `www.youtube.com/` (`pathname === "/"`).
_Avoid_: frontpage, index, main page

**Playables Shelf**:
A Home feed shelf whose header links to `/playables`, containing mini-game cards rather than videos. Identified by the `/playables` link, not by title text.
_Avoid_: Playables section (unless referring to the enclosing `ytd-rich-section-renderer`), games row, playables block

**home-playables-removal**:
The feature that removes every Playables Shelf from Home by deleting its enclosing rich section from the DOM.
_Avoid_: playables-removal, hide-playables

**Not Interested**:
YouTube's native Home video-card menu action that tells the recommendation system to stop showing that video.
_Avoid_: hide, dislike, dismiss

**home-not-interested**:
The feature that adds an inline Home card control to activate the native Not Interested action.
_Avoid_: home-hide, not-interested-button
