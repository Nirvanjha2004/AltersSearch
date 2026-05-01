# Implementation Plan: AltersSearch Frontend Rebuild

## Overview

Rebuild the AltersSearch frontend using Aceternity UI primitives, updated design tokens, and Framer Motion animations. The implementation proceeds in dependency order: infrastructure first (tokens, utilities, dependencies), then shared primitives (Aceternity UI components), then individual screen components, and finally integration wiring. All existing auth infrastructure (`AuthContext`, `authApi`, `tokenUtils`, `ProtectedRoute`) is preserved unchanged.

## Tasks

- [x] 1. Install dependencies and configure design tokens
  - [x] 1.1 Install `clsx` and `tailwind-merge` as production dependencies
    - Run `npm install clsx tailwind-merge` inside `frontend/`
    - Verify both packages appear in `package.json` dependencies
    - _Requirements: 1.4_

  - [x] 1.2 Create `cn()` utility at `frontend/src/lib/cn.ts`
    - Implement `cn(...inputs: ClassValue[])` using `clsx` and `twMerge`
    - Export the function as a named export
    - _Requirements: 1.3_

  - [x] 1.3 Update `globals.css` with new design tokens
    - Replace the existing `[data-theme="dark"]` block with the new token set: `--bg-base: #08080f`, `--card-bg: #0f0f1a`, `--accent: #7c3aed`, `--glow-accent: #a855f7`, `--text-primary: #f1f1f1`, `--text-muted: #6b7280`, `--border: #1f1f2e`
    - Keep the existing `:root` light-mode block and all animation keyframes intact
    - Update `body` background and color references to use the new token names where applicable
    - _Requirements: 1.1_

  - [x] 1.4 Extend `tailwind.config.js` with design token color palette
    - Add `colors` extension mapping `bg-base`, `card-bg`, `accent`, `glow-accent`, `text-primary`, `text-muted`, `border-token` to their respective CSS custom properties
    - _Requirements: 1.5_

  - [x] 1.5 Update font imports in `layout.tsx`
    - Replace `JetBrains_Mono` import with `Space_Mono` (or keep `Inter` as body font and add `Geist` for headings if available via `next/font/google`)
    - Assign `--font-primary` and `--font-mono` CSS variables to the loaded fonts
    - Keep `data-theme="dark"` on `<html>` and the `<Providers>` wrapper unchanged
    - _Requirements: 1.2_

- [x] 2. Add Aceternity UI primitives to `components/ui/`
  - [x] 2.1 Create `components/ui/spotlight.tsx`
    - Implement the `<Spotlight />` component that renders a radial SVG/div light effect
    - Accept `className` and `fill` props
    - Use `cn()` for class merging
    - _Requirements: 2.2, 13.2_

  - [x] 2.2 Create `components/ui/shimmer-button.tsx`
    - Implement `<ShimmerButton />` with a shimmer/shine animation on hover
    - Accept `children`, `className`, `type`, `disabled`, and `onClick` props
    - Use `cn()` for class merging
    - _Requirements: 4.1, 4.2, 13.2_

  - [x] 2.3 Create `components/ui/placeholder-vanish-input.tsx`
    - Implement `<PlaceholderAndVanishInput />` with cycling placeholder text and a vanish animation on submit
    - Accept `placeholders: string[]`, `onSubmit: (value: string) => void`, `isLoading: boolean`, and optional `initialValue` props
    - Use `cn()` for class merging
    - _Requirements: 7.5, 8.1, 13.2_

  - [x] 2.4 Create `components/ui/hover-effect.tsx`
    - Implement `<HoverEffect />` card wrapper that renders a spotlight glow on hover
    - Accept `children` and `className` props
    - Use `cn()` for class merging
    - _Requirements: 9.7, 13.2_

  - [x] 2.5 Create `components/ui/background-gradient.tsx`
    - Implement `<BackgroundGradient />` card wrapper with an animated gradient border
    - Accept `children` and `className` props
    - Use `cn()` for class merging
    - _Requirements: 9.7, 13.2_

  - [x] 2.6 Create `components/ui/moving-border.tsx`
    - Implement `<MovingBorder />` button wrapper as an alternative to `ShimmerButton`
    - Accept `children`, `className`, `type`, `disabled`, and `onClick` props
    - Use `cn()` for class merging
    - _Requirements: 4.1, 13.2_

- [x] 3. Create mock data file
  - [x] 3.1 Create `frontend/src/data/repos.ts` with `MOCK_REPOS` constant
    - Import `SearchResult` type from `../types`
    - Define at least 9 entries covering TypeScript, Python, Rust, Go, JavaScript, and at least one other language
    - Vary star counts from ~100 to ~50 000, include topics arrays (2–5 per entry), and realistic descriptions
    - Ensure no network request or environment variable is needed to import this file
    - _Requirements: 11.1, 11.2, 11.3_

- [ ] 4. Rebuild Sign In page (`app/login/page.tsx`)
  - [x] 4.1 Implement full-viewport layout with dark background and Spotlight
    - Render a full-viewport flex-center container with `background: #08080f` and a purple radial glow behind the card
    - Mount `<Spotlight className="top-0 left-0" fill="purple" />` at the top-left of the viewport
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Implement the centered auth card with branding
    - Render a card with `max-w-[400px]`, `bg-[var(--card-bg)]`, `border border-[var(--border)]`, `rounded-xl`, `p-8`
    - Render "AltersSearch" logo text in bold `--text-primary` and a BETA_Badge pill with `--glow-accent` border
    - Render `<h1>Sign in to your account</h1>` and subtext with a `<Link href="/register">Create one</Link>` styled in `--accent`
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [x] 4.3 Implement email and password inputs with focus glow
    - Render email `<input type="email">` and password `<input type="password">` each wrapped in a field container
    - Associate each input with a visible `<label>` via `htmlFor` / `id`
    - Apply `focus:ring-2 focus:ring-[var(--accent)]` and border-color transition on focus
    - _Requirements: 3.1, 3.2, 3.3, 12.3_

  - [x] 4.4 Implement form state and validation logic
    - Declare `email`, `password`, `error`, and `isSubmitting` state with `useState`
    - On submit: validate non-empty fields first (set `role="alert"` error, return early if invalid)
    - Call `login(email, password)` from `useAuth()`; on success redirect to `searchParams.get("redirect") ?? "/"`; on 401 set error to "Invalid email or password."
    - Disable both inputs and the submit button while submitting; set `aria-busy="true"` on the button
    - _Requirements: 3.4, 3.5, 3.6, 4.3, 4.4_

  - [x] 4.5 Implement ShimmerButton submit button
    - Replace the plain submit button with `<ShimmerButton type="submit">` spanning full width
    - Render a spinner icon and "Signing in…" label while `isSubmitting` is true
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 5. Rebuild Topbar (`components/Topbar.tsx`)
  - [x] 5.1 Implement Topbar layout and sticky positioning
    - Apply `position: sticky; top: 0; height: 56px; backdrop-filter: blur(12px); border-bottom: 1px solid var(--border)`
    - Render "AltersSearch" text + BETA_Badge on the left
    - _Requirements: 5.1, 5.5_

  - [x] 5.2 Implement unauthenticated and authenticated right-side controls
    - When `user` is null: render "Give feedback" ghost button, theme toggle icon button (`aria-label`), and "Sign in" link
    - When `user` is set: render "Give feedback" + theme toggle + avatar button (`aria-label`) that opens a dropdown with "Log out"
    - Call `logout()` from `useAuth()` and redirect to `/login` on log out
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 5.3 Implement hamburger button for mobile
    - Render a hamburger icon button (`aria-label="Toggle sidebar"`) on the left when viewport < 960 px
    - Accept `onToggleSidebar: () => void` and `sidebarOpen: boolean` props; wire the button to `onToggleSidebar`
    - _Requirements: 5.6, 12.5_

- [x] 6. Rebuild Sidebar (`components/Sidebar.tsx`)
  - [x] 6.1 Implement Sidebar layout and desktop positioning
    - Render a `240px`-wide panel with `background: var(--card-bg)` and `border-right: 1px solid var(--border)`
    - Position sticky below the Topbar on desktop (≥ 960 px)
    - Accept `recentSearches`, `onSelectSearch`, `onNewSearch`, `isOpen`, and `onClose` props
    - _Requirements: 6.1_

  - [x] 6.2 Implement workspace section and "+ New Search" button
    - Render "Workspace" label and "Discover repositories faster" heading
    - Render a "+ New Search" button with purple gradient background and glow shadow; call `onNewSearch` on click
    - _Requirements: 6.2, 6.3_

  - [x] 6.3 Implement Recent Searches list
    - Render up to 12 items from `recentSearches`; each item calls `onSelectSearch(query)` on click
    - When `recentSearches` is empty, render "No searches yet" in `--text-muted`
    - Render "Free" badge at the bottom in `--accent` color
    - _Requirements: 6.4, 6.5, 6.6_

  - [x] 6.4 Implement mobile slide-in behavior
    - Below 960 px: apply `position: fixed; transform: translateX(-100%)` by default; slide in when `isOpen` is true
    - Set `aria-hidden={!isOpen}` on the sidebar element
    - Render a backdrop overlay when open that calls `onClose` on click
    - _Requirements: 6.7, 12.1_

- [x] 7. Rebuild SearchBar (`components/SearchBar.tsx`)
  - [x] 7.1 Implement SearchBar wrapping PlaceholderAndVanishInput
    - Accept `onSubmit: (query: string) => void`, `isLoading: boolean`, and optional `initialValue` props
    - Wrap `<PlaceholderAndVanishInput />` with the placeholder array: `["python csv parser", "alternatives to Redis", "react drag and drop", "fast HTTP server in Go", "ML model serving framework"]`
    - Pass `onSubmit` and `isLoading` through to the inner component
    - Apply a glowing purple border container: `border border-[var(--accent)] rounded-xl focus-within:ring-2 focus-within:ring-[var(--accent)]`
    - _Requirements: 7.5, 8.1_

- [x] 8. Create SuggestionChips component (`components/SuggestionChips.tsx`)
  - [x] 8.1 Implement SuggestionChips with three preset chips
    - Accept `onSelect: (chip: string) => void` prop
    - Render three pill buttons: "python csv parser", "alternatives to Redis", "react drag and drop"
    - Style each as `bg-[var(--card-bg)] border border-[var(--border)] rounded-full px-4 py-1.5 text-sm text-[var(--text-muted)]`
    - Call `onSelect(label)` on click; apply hover state with `--accent` border
    - _Requirements: 7.3, 7.4_

- [x] 9. Create VectorSearchToggle component (`components/VectorSearchToggle.tsx`)
  - [x] 9.1 Implement VectorSearchToggle display chip
    - Render a stateless pill displaying "✦ VECTOR SEARCH"
    - Style with `text-[var(--accent)] border border-[var(--accent)/30] bg-[var(--accent)/10] rounded-full px-3 py-1 text-xs font-medium`
    - _Requirements: 7.6_

- [-] 10. Create RepoCard component (`components/RepoCard.tsx`)
  - [x] 10.1 Implement RepoCard layout and content
    - Accept `result: SearchResult` and `index: number` props
    - Render repo name in `font-bold text-[var(--text-primary)]`
    - Render description in `text-[var(--text-muted)] line-clamp-2`
    - Render up to 4 topic tags as small purple pill chips using `--accent` color
    - Render ★ star count, language dot (using `LANG_COLORS` map for TypeScript, JavaScript, Python, Rust, Go, Java, C++, Ruby, Swift, Kotlin), and "View on GitHub →" link opening in a new tab
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 10.2 Implement Framer Motion animations on RepoCard
    - Wrap card in `<motion.div>` with `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.3, delay: index * 0.06 }}`
    - Add `whileHover={{ scale: 1.02, y: -4 }}` with `transition={{ type: "spring", stiffness: 300 }}`
    - _Requirements: 9.8, 10.2_

  - [-] 10.3 Wrap RepoCard in HoverEffect or BackgroundGradient
    - Wrap the inner card content in `<BackgroundGradient>` (or `<HoverEffect>`) from `components/ui/`
    - Add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space to open the GitHub URL
    - _Requirements: 9.7, 12.4_

- [ ] 11. Create ResultsGrid component (`components/ResultsGrid.tsx`)
  - [ ] 11.1 Implement ResultsGrid layout and states
    - Accept `results: SearchResult[]` and `isLoading: boolean` props
    - Apply `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`
    - When `isLoading` is true: render 6 `<SkeletonCard />` components in the grid
    - When `results` is empty and not loading: render the empty-state message "No repositories found" with sub-label "Try a different query or search the web"
    - When `results` has items: render a `<RepoCard result={r} index={i} />` for each entry
    - _Requirements: 10.1, 10.4_

  - [ ] 11.2 Wire AnimatePresence for results entrance
    - Wrap the results list in `<AnimatePresence>` so cards animate in when the results array changes
    - _Requirements: 10.2_

- [ ] 12. Rebuild SkeletonCard (`components/SkeletonCard.tsx`)
  - [ ] 12.1 Implement SkeletonCard matching RepoCard dimensions
    - Render an `animate-pulse` placeholder with `bg-[var(--border)]` blocks matching the RepoCard height and layout
    - Include placeholder blocks for: repo name line, two description lines, topic chips row, and footer row
    - Apply `rounded-xl` border radius and `bg-[var(--card-bg)]` card background
    - _Requirements: 8.2_

- [ ] 13. Rebuild Search page (`app/page.tsx`)
  - [ ] 13.1 Implement three-zone layout with Topbar and Sidebar
    - Render `<Topbar onToggleSidebar={...} sidebarOpen={...} />` as the sticky top bar
    - Render `<Sidebar recentSearches={...} onSelectSearch={...} onNewSearch={...} isOpen={...} onClose={...} />` as the fixed left panel
    - Render a `<main>` element with `flex-1` taking the remaining space
    - Declare all required state: `query`, `results`, `recentSearches`, `isLoading`, `error`, `viewState`, `sidebarOpen`, `clarification`
    - _Requirements: 5.1–5.6, 6.1–6.7, 13.1_

  - [ ] 13.2 Implement empty state hero section
    - When `viewState === "empty"`: render centered `<h1>AltersSearch</h1>`, tagline "Find the right repo. Instantly." in `--text-muted`, `<SuggestionChips onSelect={handleChipSelect} />`, `<SearchBar />`, and `<VectorSearchToggle />`
    - `handleChipSelect` should populate the query and immediately call `handleSearch`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 13.3 Implement search submission and API call
    - `handleSearch(query)` should: push query to `recentSearches` (deduplicated, max 12, most-recent-first), set `viewState("loading")`, POST to `http://localhost:8000/api/search` with `{ query }`, then on `clarification_needed` set `clarification`, on `success` set `results` and `viewState("results")`, on error set `error` and `viewState("empty")`
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [ ] 13.4 Implement results view and AnimatePresence transitions
    - When `viewState === "results"`: render `<ResultsGrid results={results} isLoading={false} />`
    - When `viewState === "loading"`: render `<ResultsGrid results={[]} isLoading={true} />`
    - Wrap both views in `<AnimatePresence mode="wait">` with `<motion.div>` fade transitions (key="empty" / key="results")
    - Render error banner with `role="alert"` when `error` is set
    - _Requirements: 7.7, 8.2, 8.4_

- [ ] 14. Checkpoint — verify integration
  - Ensure all TypeScript types resolve without errors by running `npx tsc --noEmit` inside `frontend/`
  - Ensure all existing tests still pass by running `npm test` inside `frontend/`
  - Verify the `cn()` utility, design tokens, and Aceternity UI components are imported correctly across all new files
  - Ask the user if any visual or behavioral adjustments are needed before proceeding.

- [ ] 15. Accessibility audit and final polish
  - [ ] 15.1 Audit all icon-only buttons for `aria-label`
    - Confirm hamburger, theme toggle, and avatar buttons each have a descriptive `aria-label`
    - _Requirements: 12.5_

  - [ ] 15.2 Audit focus indicators across all interactive elements
    - Confirm `focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none` is applied to all buttons, inputs, and links
    - _Requirements: 12.2_

  - [ ] 15.3 Audit RepoCard keyboard navigation
    - Confirm `role="button"`, `tabIndex={0}`, and `onKeyDown` (Enter/Space → open GitHub URL) are present on clickable cards
    - _Requirements: 12.4_

  - [ ] 15.4 Audit all `role="alert"` error elements
    - Confirm Sign In page validation errors, 401 errors, and Search page error banners all use `role="alert"`
    - _Requirements: 12.6_

- [ ] 16. Final checkpoint — ensure all tests pass
  - Run `npm test` inside `frontend/` and confirm all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design uses TypeScript throughout; all new files must be `.tsx` or `.ts`
- Aceternity UI components in `components/ui/` are inlined — no external Aceternity package is installed
- All auth logic (`AuthContext`, `authApi`, `tokenUtils`, `ProtectedRoute`) is preserved unchanged
- `MOCK_REPOS` from `data/repos.ts` is used as fallback when no live API results are available
- The existing `ResultCard.tsx` component is superseded by `RepoCard.tsx` but need not be deleted until the rebuild is verified
