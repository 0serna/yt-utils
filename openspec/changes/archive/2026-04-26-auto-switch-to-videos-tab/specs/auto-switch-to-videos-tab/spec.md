## ADDED Requirements

### Requirement: Detect channel home page

The system SHALL detect when the current page is a YouTube channel's "Home" tab.

#### Scenario: User lands on channel home

- **WHEN** the user navigates to a YouTube channel page
- **THEN** the system determines whether the "Home" tab has `aria-selected="true"`

### Requirement: Click Videos tab once per session

The system SHALL click the "Videos" tab automatically when the user lands on a channel's "Home" tab, but only once per browser tab session.

#### Scenario: First visit to channel home in a tab

- **WHEN** the user lands on a channel's "Home" tab in a browser tab where the session flag is not set
- **THEN** the system clicks the "Videos" tab
- **AND** the system sets a session flag to prevent future auto-switches for this channel in the same tab

#### Scenario: Manual return to channel home

- **WHEN** the user clicks the "Home" tab after an earlier auto-switch
- **THEN** the system does NOT click the "Videos" tab again

#### Scenario: Channel page without a Videos tab

- **WHEN** the user lands on a channel's "Home" tab and no "Videos" tab exists in the DOM
- **THEN** the system does nothing and remains silent

### Requirement: Support all channel URL formats

The system SHALL support all YouTube channel URL formats.

#### Scenario: Handle-style URL

- **WHEN** the user visits `https://www.youtube.com/@ChannelName`
- **THEN** the feature activates and evaluates the page

#### Scenario: Custom URL

- **WHEN** the user visits `https://www.youtube.com/c/ChannelName`
- **THEN** the feature activates and evaluates the page

#### Scenario: Legacy user URL

- **WHEN** the user visits `https://www.youtube.com/user/ChannelName`
- **THEN** the feature activates and evaluates the page

#### Scenario: Channel ID URL

- **WHEN** the user visits `https://www.youtube.com/channel/UC...`
- **THEN** the feature activates and evaluates the page

#### Scenario: Sub-path URLs

- **WHEN** the user visits a channel sub-path such as `/@ChannelName/featured`
- **THEN** the feature still activates because the page may render the Home tab as selected
