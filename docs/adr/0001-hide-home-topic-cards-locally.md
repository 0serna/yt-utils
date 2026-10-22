# Hide Home topic cards locally instead of using Not Interested

`home-auto-hide-topics` hides matching Home cards with its own `display: none` and marker attribute. It never opens the native `...` menu and never clicks `No me interesa`. Local hiding is silent, synchronous, and idempotent; driving the native action required a serialized queue, timeouts, and retries.

**Consequences**: YouTube receives no signal, so recommendations do not learn and the effect lasts only for the page. The manual `home-not-interested` feature stays for deliberate actions.

**Considered options**: automating native `Not Interested` was implemented first and replaced. It trained recommendations, but it needed menu automation against a changing UI and caused menu flicker.
