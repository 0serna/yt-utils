# The extension owns Original Audio Track selection, once per Watch Session

`original-audio-track` selects and applies the Original Audio Track through the player bridge when the active track is dubbed. It applies at most once per Watch Session, so a later manual choice is not reverted, and it retries a rejected change up to a bounded limit. Before this change, an external extension changed the audio and the subtitle policy misread that change as a Subtitle Override.

**Consequences**: if the player resets to dubbed audio after an ad or a player reload, the feature does not fight it; reloading the page applies the track again. The subtitle policy follows the audio by polling and re-deciding on the next cycle, with no feature-to-feature messaging.
