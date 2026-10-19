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

**home-auto-hide-topics**:
The feature that hides Home video cards whose visible title, channel name, or handle matches a topic in the code-fixed topic registry, without triggering YouTube's native Not Interested action.
_Avoid_: home-keyword-filter, home-auto-not-interested-topics, home-topic-filter, clash-filter

**Watch Session**:
A feature's continuous period of activity for one video on the desktop YouTube watch page. Leaving that video or deactivating the feature ends its Watch Session; returning to the same video starts a new one.
_Avoid_: video ID alone as a synonym for Watch Session

**Audio Track**:
A selectable audio stream of a watch video, exposed by the player as `getAvailableAudioTracks()`. Exactly one is active at a time.
_Avoid_: audio language, audio source, soundtrack

**Original Audio Track**:
The audio track whose metadata reports `isAutoDubbed: false`. It carries the creator's language, not a dub.
_Avoid_: default track, native audio, base track

**Dubbed Audio Track**:
An audio track whose metadata reports `isAutoDubbed: true`. YouTube generated it by auto-dubbing the Original Audio Track.
_Avoid_: translated audio, auto track, alternate audio

**original-audio-track**:
The feature that selects the Original Audio Track for every Watch Session.
_Avoid_: audio-fixer, force-original-audio, yt-original-audio

**Subtitle Override**:
A subtitle state change the subtitle policy did not cause during the current Watch Session, or an audio change that later resolves to a different subtitle decision. An Override stops the policy for that Watch Session.
_Avoid_: user change, manual mode, lock
