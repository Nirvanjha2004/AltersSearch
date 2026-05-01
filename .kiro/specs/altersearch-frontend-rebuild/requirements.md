# Requirements Document

## Introduction

AltersSearch (BETA) is a GitHub repository search SaaS that lets developers find repos, libraries, and alternatives using natural language and vector search. This feature covers a complete frontend rebuild using Aceternity UI, Tailwind CSS, and Framer Motion on top of the existing Next.js App Router project. The rebuild replaces all existing screen components with three new screens — Sign In, Main Search, and Search Results — while preserving the existing authentication context, API integration, and routing logic.

## Glossary

- **App**: The AltersSearch Next.js App Router frontend located in `frontend/`.
- **Sign_In_Page**: The `/login` route that authenticates returning users.
- **Search_Page**: The `/` (home) route that presents the search interface.
- **Results_Grid**: The responsive grid of repo cards rendered after a search is submitted.
- **Repo_Card**: A single card in the Results_Grid representing one GitHub repository.
- **Sidebar**: The 240 px-wide left panel on the Search_Page containing workspace info, new-search action, and recent searches.
- **Topbar**: The sticky top navigation bar present on the Search_Page.
- **Spotlight**: Aceternity UI's `<Spotlight />` component that renders a radial light effect.
- **ShimmerButton**: Aceternity UI's animated button component with a shimmer/shine effect on hover.
- **PlaceholderAndVanishInput**: Aceternity UI's search input component with animated placeholder cycling and a vanish-on-submit effect.
- **HoverEffect**: Aceternity UI's card wrapper that renders a spotlight glow on hover.
- **BackgroundGradient**: Aceternity UI's card wrapper that renders an animated gradient border.
- **Design_Tokens**: The global CSS custom properties defined in `globals.css` that govern color, spacing, and typography.
- **cn**: The class-merging utility composed of `clsx` and `tailwind-merge`.
- **Mock_Repos**: Hardcoded repository data stored in `frontend/src/data/repos.ts` used for UI development and demonstration.
- **Vector_Search_Toggle**: The `✦ VECTOR SEARCH` chip below the search input that indicates the active search mode.
- **Suggestion_Chip**: A pill-shaped button displaying a pre-written query that populates the search input on click.
- **BETA_Badge**: The glowing purple badge rendered next to the "AltersSearch" logo text.
- **AuthContext**: The existing React context in `frontend/src/contexts/AuthContext.tsx` that manages authentication state.

---

## Requirements

### Requirement 1: Global Design Tokens and Utility Setup

**User Story:** As a developer, I want a consistent set of design tokens and a `cn()` utility available globally, so that all components share the same visual language without duplicating style values.

#### Acceptance Criteria

1. THE App SHALL define the following CSS custom properties in `globals.css` under the `[data-theme="dark"]` selector: `--bg-base: #08080f`, `--card-bg: #0f0f1a`, `--accent: #7c3aed`, `--glow-accent: #a855f7`, `--text-primary: #f1f1f1`, `--text-muted: #6b7280`, `--border: #1f1f2e`.
2. THE App SHALL import the Geist font (or Space Mono as fallback) for headings and Inter for body text via Next.js `next/font/google` in `layout.tsx`.
3. THE App SHALL expose a `cn(...inputs)` utility function in `frontend/src/lib/cn.ts` that merges class names using `clsx` and `tailwind-merge`.
4. THE App SHALL install `clsx` and `tailwind-merge` as production dependencies.
5. THE App SHALL configure `tailwind.config.js` to extend the default theme with the Design_Tokens color palette so Tailwind utility classes reference the same values.
6. WHEN a component applies border-radius to a card element, THE App SHALL use `rounded-xl` (12 px) for cards and `rounded-lg` (8 px) for inputs, consistent with the Design_Tokens specification.

---

### Requirement 2: Sign In Page — Layout and Visual Structure

**User Story:** As a returning user, I want a visually polished sign-in screen with a dark background and a centered card, so that the product feels premium and trustworthy from the first interaction.

#### Acceptance Criteria

1. THE Sign_In_Page SHALL render a full-viewport dark background with background color `#08080f` and a purple radial glow (`#7c3aed` at reduced opacity) centered behind the card.
2. THE Sign_In_Page SHALL render the Spotlight component positioned to shine from the top-left of the viewport.
3. THE Sign_In_Page SHALL render a centered card with a maximum width of 400 px, background color `#0f0f1a`, a 1 px border using `--border` color, and `rounded-xl` border radius.
4. THE Sign_In_Page SHALL render the "AltersSearch" logo text in bold white (`--text-primary`) and the BETA_Badge as a glowing purple pill with border color derived from `--glow-accent`.
5. THE Sign_In_Page SHALL render the heading "Sign in to your account" as an `<h1>` element styled with `--text-primary`.
6. THE Sign_In_Page SHALL render the subtext "Don't have an account? Create one" where "Create one" is a Next.js `<Link>` to `/register` styled in `--accent` purple.

---

### Requirement 3: Sign In Page — Form Inputs

**User Story:** As a returning user, I want styled email and password inputs with clear focus states, so that I can enter my credentials comfortably on any device.

#### Acceptance Criteria

1. THE Sign_In_Page SHALL render an email input and a password input using Aceternity UI's `<Input />` styled component or a custom input that matches the Aceternity aesthetic with a subtle border glow on focus.
2. WHEN an input receives focus, THE Sign_In_Page SHALL apply a purple glow (`box-shadow: 0 0 0 3px` with `--accent` at reduced opacity) and change the border color to `--accent`.
3. THE Sign_In_Page SHALL label each input with a visible `<label>` element associated via `htmlFor` / `id` for accessibility.
4. WHILE the form is submitting, THE Sign_In_Page SHALL disable both inputs and the submit button and set `aria-busy="true"` on the button.
5. IF the user submits the form with an empty email or password field, THEN THE Sign_In_Page SHALL display an inline error message in a `role="alert"` element without making a network request.
6. IF the authentication API returns a 401 response, THEN THE Sign_In_Page SHALL display the message "Invalid email or password." in a `role="alert"` element.

---

### Requirement 4: Sign In Page — Submit Button

**User Story:** As a returning user, I want a visually engaging sign-in button with a shimmer animation, so that the interaction feels modern and responsive.

#### Acceptance Criteria

1. THE Sign_In_Page SHALL render a full-width submit button using Aceternity UI's ShimmerButton or MovingBorderButton component.
2. WHEN the user hovers over the submit button, THE Sign_In_Page SHALL display a shimmer or moving-border animation on the button.
3. WHEN the form submission succeeds, THE Sign_In_Page SHALL redirect the user to the path specified in the `redirect` query parameter, or to `/` if no parameter is present.
4. WHILE the form is submitting, THE Sign_In_Page SHALL render a spinner icon inside the button and display the label "Signing in…".

---

### Requirement 5: Search Page — Topbar

**User Story:** As an authenticated user, I want a persistent top navigation bar with branding, feedback, theme toggle, and sign-in controls, so that I can access key actions from any state of the search page.

#### Acceptance Criteria

1. THE Topbar SHALL render "AltersSearch" text on the left side followed by the BETA_Badge.
2. THE Topbar SHALL render a "Give feedback" ghost button, a theme toggle icon button, and a "Sign in" link on the right side when the user is unauthenticated.
3. WHEN the user is authenticated, THE Topbar SHALL replace the "Sign in" link with a user avatar button that opens a dropdown menu containing a "Log out" option.
4. WHEN the user clicks "Log out", THE Topbar SHALL call the `logout` function from AuthContext and redirect to `/login`.
5. THE Topbar SHALL be sticky at the top of the viewport with a height of 56 px, a bottom border using `--border` color, and a backdrop blur of 12 px.
6. WHEN the viewport width is below 960 px, THE Topbar SHALL render a hamburger icon button on the left that toggles the Sidebar open and closed.

---

### Requirement 6: Search Page — Sidebar

**User Story:** As a user, I want a left sidebar with workspace context, a new-search action, and a history of recent searches, so that I can quickly navigate between searches without losing context.

#### Acceptance Criteria

1. THE Sidebar SHALL be 240 px wide, positioned to the left of the main content area, with background color `#0f0f1a` and a right border using `--border` color.
2. THE Sidebar SHALL render a workspace section at the top containing the label "Workspace" and the heading "Discover repositories faster".
3. THE Sidebar SHALL render a "+ New Search" button with a purple gradient background and a glow shadow, which resets the search state when clicked.
4. THE Sidebar SHALL render a "Recent Searches" section that lists up to 12 previous queries; WHEN no searches have been made, THE Sidebar SHALL display the text "No searches yet".
5. WHEN the user clicks a recent search item, THE Sidebar SHALL trigger a new search with that query.
6. THE Sidebar SHALL render a "Free" badge at the bottom using `--accent` color.
7. WHEN the viewport width is below 960 px, THE Sidebar SHALL be hidden off-screen by default and slide in from the left WHEN the hamburger button in the Topbar is activated.

---

### Requirement 7: Search Page — Main Content Area (Empty State)

**User Story:** As a user arriving at the search page, I want a centered hero section with a large heading, tagline, suggestion chips, and a prominent search input, so that I immediately understand what the product does and can start searching.

#### Acceptance Criteria

1. THE Search_Page SHALL render the heading "AltersSearch" as a large bold `<h1>` centered in the main content area when no search has been submitted.
2. THE Search_Page SHALL render the subheading "Find the right repo. Instantly." in `--text-muted` color below the main heading.
3. THE Search_Page SHALL render three Suggestion_Chips with the labels "python csv parser", "alternatives to Redis", and "react drag and drop" as dark pill buttons below the subheading.
4. WHEN the user clicks a Suggestion_Chip, THE Search_Page SHALL populate the search input with the chip's label text and submit the search.
5. THE Search_Page SHALL render the PlaceholderAndVanishInput component (or a custom equivalent) as the primary search input with a glowing purple border.
6. THE Search_Page SHALL render the Vector_Search_Toggle chip ("✦ VECTOR SEARCH") in purple below the search input to indicate the active search mode.
7. WHEN the user submits a search query, THE Search_Page SHALL transition from the empty state to the Results_Grid view using an AnimatePresence fade transition.

---

### Requirement 8: Search Page — Search Input Behavior

**User Story:** As a user, I want the search input to accept natural language queries and submit them to the backend, so that I can find relevant repositories without knowing exact repo names.

#### Acceptance Criteria

1. WHEN the user presses Enter or clicks the submit icon inside the search input, THE Search_Page SHALL call the backend search API at `http://localhost:8000/api/search` with the query as a JSON body.
2. WHILE a search request is in flight, THE Search_Page SHALL display skeleton loading cards in place of results.
3. IF the backend returns a `clarification_needed` status, THEN THE Search_Page SHALL display a clarification prompt and a pre-filled search input for the user to refine the query.
4. IF the backend returns an error status or the network request fails, THEN THE Search_Page SHALL display an error banner with a descriptive message.
5. THE Search_Page SHALL preserve the last 12 submitted queries in the Sidebar's Recent Searches list, deduplicated and ordered most-recent-first.

---

### Requirement 9: Search Results — Repo Card

**User Story:** As a user viewing search results, I want each repository displayed as a rich card with key metadata, so that I can quickly evaluate relevance without leaving the page.

#### Acceptance Criteria

1. THE Repo_Card SHALL display the repository name in bold white (`--text-primary`).
2. THE Repo_Card SHALL display the repository description in `--text-muted` color, clamped to two lines.
3. THE Repo_Card SHALL display up to four topic tags as small purple pill chips using `--accent` color.
4. THE Repo_Card SHALL display the GitHub star count with a ★ icon.
5. THE Repo_Card SHALL display the programming language with a colored dot matching the language's conventional color.
6. THE Repo_Card SHALL display a "View on GitHub →" link at the bottom that opens the repository URL in a new tab.
7. THE Repo_Card SHALL use Aceternity UI's HoverEffect or BackgroundGradient component as the card wrapper to provide a spotlight or gradient-border hover effect.
8. WHEN the Repo_Card is hovered, THE Repo_Card SHALL apply a subtle scale-up and y-axis lift animation via Framer Motion.

---

### Requirement 10: Search Results — Results Grid Layout

**User Story:** As a user viewing search results, I want results displayed in a responsive grid that adapts to my screen size, so that I can scan many results efficiently on any device.

#### Acceptance Criteria

1. THE Results_Grid SHALL render 3 columns on desktop viewports (≥ 1024 px), 2 columns on tablet viewports (640 px – 1023 px), and 1 column on mobile viewports (< 640 px).
2. WHEN results are loaded, THE Results_Grid SHALL animate each Repo_Card in with a staggered fade-up effect using Framer Motion, with a delay increment of 60 ms per card.
3. THE Results_Grid SHALL render Mock_Repos data from `frontend/src/data/repos.ts` when no live API results are available, to support UI development and demonstration.
4. WHEN the Results_Grid contains zero items after filtering, THE Results_Grid SHALL display an empty-state message: "No repositories found" with a sub-label "Try a different query or search the web".

---

### Requirement 11: Mock Repository Data

**User Story:** As a developer, I want a hardcoded set of representative repository records, so that the UI can be developed and demonstrated without a live backend connection.

#### Acceptance Criteria

1. THE App SHALL provide a file at `frontend/src/data/repos.ts` that exports a `MOCK_REPOS` constant typed as an array of `SearchResult`.
2. THE Mock_Repos array SHALL contain at least 9 entries covering a variety of programming languages, star counts, topics, and descriptions to exercise all card layout states.
3. WHEN the Mock_Repos data is imported, THE App SHALL not require any network request or environment variable to render the Results_Grid.

---

### Requirement 12: Accessibility and Keyboard Navigation

**User Story:** As a user who relies on keyboard navigation or assistive technology, I want all interactive elements to be reachable and operable without a mouse, so that the app is usable regardless of input method.

#### Acceptance Criteria

1. THE App SHALL ensure all interactive elements (buttons, links, inputs) are reachable via Tab key navigation in a logical order.
2. THE App SHALL provide visible focus indicators on all interactive elements using a `box-shadow` ring derived from `--accent`.
3. THE Sign_In_Page SHALL associate every input with a visible `<label>` via `htmlFor` / `id`.
4. THE Repo_Card SHALL expose `role="button"` and `tabIndex={0}` when it is clickable, and SHALL respond to Enter and Space key presses.
5. THE App SHALL provide `aria-label` attributes on all icon-only buttons (theme toggle, hamburger, avatar).
6. IF an error message is displayed, THEN THE App SHALL render it in an element with `role="alert"` so screen readers announce it immediately.

---

### Requirement 13: Component Modularity

**User Story:** As a developer maintaining the codebase, I want each screen and major UI section in its own file, so that components are easy to locate, test, and modify independently.

#### Acceptance Criteria

1. THE App SHALL implement each of the following as a separate file: `SignInPage`, `SearchPage`, `Topbar`, `Sidebar`, `SearchBar`, `RepoCard`, `ResultsGrid`, `SuggestionChips`, `VectorSearchToggle`, `SkeletonCard`.
2. THE App SHALL place all Aceternity UI component wrappers in `frontend/src/components/ui/` to separate third-party UI primitives from application-level components.
3. THE App SHALL use the `cn()` utility from `frontend/src/lib/cn.ts` for all conditional class merging throughout the codebase.
4. THE App SHALL not introduce any new global state management library; all state SHALL be managed via React `useState` and `useContext` hooks consistent with the existing AuthContext pattern.
