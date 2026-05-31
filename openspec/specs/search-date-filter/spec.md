## Purpose

Automatically add the "Last year" time filter to YouTube search results when no filter is already applied, improving search relevance by showing only recent content.

## Requirements

### Requirement: Feature activates on search results pages

The feature SHALL activate only on YouTube search results pages where the URL path is `/results` and contains a `search_query` parameter.

#### Scenario: Search results page without filter

- **WHEN** the user navigates to `https://www.youtube.com/results?search_query=brave+vs+chrome`
- **THEN** the feature activates

#### Scenario: Non-search page

- **WHEN** the user navigates to `https://www.youtube.com/watch?v=abc123`
- **THEN** the feature does not activate

#### Scenario: Search results page with existing filter

- **WHEN** the user navigates to `https://www.youtube.com/results?search_query=brave+vs+chrome&sp=EgIIBg%253D%253D`
- **THEN** the feature activates but does not modify the URL

### Requirement: Add Last year filter to unfiltered searches

The feature SHALL redirect to the same search URL with the `sp` parameter set to `EgIIBQ%253D%253D` when no `sp` parameter exists.

#### Scenario: Search without sp parameter

- **WHEN** the user is on `/results?search_query=brave+vs+chrome` (no `sp` parameter)
- **THEN** the URL changes to `/results?search_query=brave+vs+chrome&sp=EgIIBQ%253D%253D`

#### Scenario: Search with existing sp parameter

- **WHEN** the user is on `/results?search_query=brave+vs+chrome&sp=EgIIBg%253D%253D`
- **THEN** the URL remains unchanged

### Requirement: Preserve search query during redirect

The feature SHALL preserve the original `search_query` parameter and any other query parameters when adding the filter.

#### Scenario: Search with additional parameters

- **WHEN** the user is on `/results?search_query=brave+vs+chrome&special=1`
- **THEN** the URL changes to `/results?search_query=brave+vs+chrome&special=1&sp=EgIIBQ%253D%253D`
