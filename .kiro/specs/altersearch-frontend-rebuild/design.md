# Design Document

## Overview

This document describes the technical design for the AltersSearch frontend rebuild. The rebuild replaces all existing screen components with three new screens (Sign In, Main Search, Search Results) using Aceternity UI, Tailwind CSS, and Framer Motion, while preserving the existing `AuthContext`, `authApi`, `tokenUtils`, `ProtectedRoute`, and the Next.js App Router structure.

---

## Architecture

### Technology Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 App Router (existing) |
| Styling | Tailwind CSS v3 + CSS custom properties |
| Animation | Framer Motion v12 (existing) |
| UI Primitives | Aceternity UI (manually copied into `components/ui/`) |
| Class merging | `clsx` + `tailwind-merge` via `cn()` |
| State | React `useState` + `useContext` (no new libraries) |
| Auth | Existing `AuthContext` / `authApi` / `tokenUtils` |
| Icons | `lucide-react` (existing) |

### File Structure

```
frontend/src/
├── app/
│   ├── globals.css              # Design tokens + base styles (updated)
│   ├── layout.tsx               # Font imports updated (Geist + Inter)
│   ├── page.tsx                 # SearchPage (rebuilt)
│   └── login/
│       └── page.tsx             # SignInPage (rebuilt)
├── components/
│   ├── ui/                      # Aceternity UI primitives
│   │   ├── spotlight.tsx
│   │   ├── shimmer-button.tsx
│   │   ├── moving-border.tsx
│   │   ├── placeholder-vanish-input.tsx
│   │   ├── hover-effect.tsx
│   │   └── background-gradient.tsx
│   ├── Topbar.tsx               # Rebuilt
│   ├── Sidebar.tsx              # Rebuilt
│   ├── SearchBar.tsx            # Rebuilt (wraps PlaceholderVanishInput)
│   ├── RepoCard.tsx             # New (replaces ResultCard)
│   ├── ResultsGrid.tsx          # New
│   ├── SuggestionChips.tsx      # New
│   ├── VectorSearchToggle.tsx   # New
│   └── SkeletonCard.tsx         # Rebuilt
├── data/
│   └── repos.ts                 # MOCK_REPOS constant
├── lib/
│   ├── cn.ts                    # cn() utility (new)
│   ├── authApi.ts               # Preserved
│   └── tokenUtils.ts            # Preserved
├── contexts/
│   └── AuthContext.tsx          # Preserved
└── types/
    └── index.ts                 # SearchResult type (preserved)
```

---

## Design Tokens

Design tokens are defined as CSS custom properties in `globals.css` under the `:root` and `[data-theme="dark"]` selectors, and mirrored in `tailwind.config.js` so Tailwind utility classes can reference them.

### CSS Custom Properties (`globals.css`)

```css
[data-theme="dark"] {
  --bg-base:        #08080f;
  --card-bg:        #0f0f1a;
  --accent:         #7c3aed;
  --glow-accent:    #a855f7;
  --text-primary:   #f1f1f1;
  --text-muted:     #6b7280;
  --border:         #1f1f2e;
}
```

### Tailwind Config Extension (`tailwind.config.js`)

```js
theme: {
  extend: {
    colors: {
      'bg-base':     'var(--bg-base)',
      'card-bg':     'var(--card-bg)',
      'accent':      'var(--accent)',
      'glow-accent': 'var(--glow-accent)',
      'text-primary':'var(--text-primary)',
      'text-muted':  'var(--text-muted)',
      'border-token':'var(--border)',
    },
  },
},
```

---

## Component Designs

### `cn()` Utility (`lib/cn.ts`)

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### Aceternity UI Primitives (`components/ui/`)

These are copied/adapted from the Aceternity UI source. Each file is a self-contained React component with no external Aceternity dependency — they are inlined into the project.

| File | Component | Usage |
|---|---|---|
| `spotlight.tsx` | `<Spotlight />` | Sign In page background effect |
| `shimmer-button.tsx` | `<ShimmerButton />` | Sign In submit button |
| `moving-border.tsx` | `<MovingBorder />` | Alternative to ShimmerButton |
| `placeholder-vanish-input.tsx` | `<PlaceholderAndVanishInput />` | Search input |
| `hover-effect.tsx` | `<HoverEffect />` | Repo card wrapper |
| `background-gradient.tsx` | `<BackgroundGradient />` | Alternative card wrapper |

---

### Sign In Page (`app/login/page.tsx`)

**Layout:** Full-viewport flex-center. Background `#08080f` with a `radial-gradient` purple glow behind the card. `<Spotlight />` positioned top-left.

**Card:** `max-w-[400px]`, `bg-[var(--card-bg)]`, `border border-[var(--border)]`, `rounded-xl`, `p-8`.

**State:**
```ts
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Submit flow:**
1. Client-side validation → set error, return early if empty fields.
2. Call `login(email, password)` from `useAuth()`.
3. On success → `router.replace(searchParams.get("redirect") ?? "/")`.
4. On 401/error → set error to "Invalid email or password."

**Key elements:**
- `<Spotlight className="top-0 left-0" fill="purple" />`
- Logo: `<span>AltersSearch</span>` + `<BetaBadge />`
- `<h1>Sign in to your account</h1>`
- Subtext with `<Link href="/register">Create one</Link>`
- Email `<input>` + Password `<input>` with focus glow via Tailwind `focus:ring-2 focus:ring-[var(--accent)]`
- `<ShimmerButton type="submit">` full-width, spinner while submitting
- Error in `<div role="alert">`

---

### Search Page (`app/page.tsx`)

**Layout:** Three-zone layout: `<Topbar />` (sticky, 56px) + `<Sidebar />` (240px, fixed left) + `<main>` (flex-1).

**State:**
```ts
const [query, setQuery] = useState("");
const [results, setResults] = useState<SearchResult[]>([]);
const [recentSearches, setRecentSearches] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [viewState, setViewState] = useState<"empty" | "loading" | "results">("empty");
const [sidebarOpen, setSidebarOpen] = useState(false);
const [clarification, setClarification] = useState<string | null>(null);
```

**Search flow:**
1. User submits query via `<SearchBar />`.
2. `setViewState("loading")` → show `<SkeletonCard />` grid.
3. `POST http://localhost:8000/api/search` with `{ query }`.
4. On `clarification_needed` → show clarification prompt.
5. On `success` → `setResults(data.results)`, `setViewState("results")`.
6. On error → show error banner.
7. Push query to `recentSearches` (deduplicated, max 12, most-recent-first).

**Empty state → Results transition:** `<AnimatePresence mode="wait">` wrapping both views with `motion.div` fade.

---

### Topbar (`components/Topbar.tsx`)

**Props:**
```ts
interface TopbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}
```

**Layout:** `position: sticky; top: 0; height: 56px; backdrop-filter: blur(12px); border-bottom: 1px solid var(--border)`.

**Left:** Hamburger (< 960px) + "AltersSearch" + `<BetaBadge />`.

**Right (unauthenticated):** "Give feedback" ghost button + theme toggle + "Sign in" link.

**Right (authenticated):** "Give feedback" + theme toggle + avatar button → dropdown with "Log out".

**Auth detection:** `const { user, logout } = useAuth()`.

---

### Sidebar (`components/Sidebar.tsx`)

**Props:**
```ts
interface SidebarProps {
  recentSearches: string[];
  onSelectSearch: (query: string) => void;
  onNewSearch: () => void;
  isOpen: boolean;
  onClose: () => void;
}
```

**Layout:** `width: 240px; background: var(--card-bg); border-right: 1px solid var(--border)`. On mobile (< 960px): `position: fixed; transform: translateX(-100%)` → slides in when `isOpen`.

**Sections:**
1. Workspace header: "Workspace" label + "Discover repositories faster" heading.
2. "+ New Search" button: purple gradient bg + glow shadow.
3. "Recent Searches" list: up to 12 items, clickable. Empty state: "No searches yet".
4. Bottom: "Free" badge in `--accent` color.

---

### SearchBar (`components/SearchBar.tsx`)

**Props:**
```ts
interface SearchBarProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  initialValue?: string;
}
```

Wraps `<PlaceholderAndVanishInput />` with placeholders cycling through example queries. On submit, calls `onSubmit(value)`.

---

### SuggestionChips (`components/SuggestionChips.tsx`)

**Props:**
```ts
interface SuggestionChipsProps {
  onSelect: (chip: string) => void;
}
```

Renders three pill buttons: "python csv parser", "alternatives to Redis", "react drag and drop". Each is `bg-[var(--card-bg)] border border-[var(--border)] rounded-full px-4 py-1.5 text-sm text-[var(--text-muted)]`. On click → `onSelect(label)`.

---

### VectorSearchToggle (`components/VectorSearchToggle.tsx`)

Stateless display chip. Renders `✦ VECTOR SEARCH` in a pill with `text-[var(--accent)] border border-[var(--accent)/30] bg-[var(--accent)/10]`.

---

### RepoCard (`components/RepoCard.tsx`)

**Props:**
```ts
interface RepoCardProps {
  result: SearchResult;
  index: number;
}
```

Wrapped in `<BackgroundGradient>` or `<HoverEffect>`. Inner card: `bg-[var(--card-bg)] rounded-xl p-5`.

**Framer Motion:** `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}`.

**Hover:** `whileHover={{ scale: 1.02, y: -4 }}`.

**Content layout:**
1. Repo name — `font-bold text-[var(--text-primary)]`
2. Description — `text-[var(--text-muted)] line-clamp-2`
3. Topics — up to 4 purple pill chips
4. Footer row: ★ star count + language dot + "View on GitHub →" link

**Language dot colors** (conventional):
```ts
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  // ...
};
```

---

### ResultsGrid (`components/ResultsGrid.tsx`)

**Props:**
```ts
interface ResultsGridProps {
  results: SearchResult[];
  isLoading: boolean;
}
```

**Loading state:** 6 `<SkeletonCard />` components in the same grid.

**Grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`.

**Empty state:** "No repositories found" + "Try a different query or search the web".

---

### SkeletonCard (`components/SkeletonCard.tsx`)

Animated pulse placeholder matching `RepoCard` dimensions. Uses `animate-pulse` Tailwind class with `bg-[var(--border)]` blocks.

---

## Mock Data (`data/repos.ts`)

```ts
import type { SearchResult } from "../types";

export const MOCK_REPOS: SearchResult[] = [
  // 9+ entries covering TypeScript, Python, Rust, Go, JavaScript, etc.
  // Varying star counts (100 – 50k), topics, descriptions
];
```

The `SearchResult` type is imported from the existing `types/index.ts` — no new type definitions needed.

---

## Data Flow

```
User types query
      │
      ▼
SearchBar.onSubmit(query)
      │
      ▼
SearchPage.handleSearch(query)
  ├─ pushRecentSearch(query) → Sidebar updates
  ├─ setViewState("loading") → ResultsGrid shows skeletons
  ├─ POST /api/search
  │     ├─ clarification_needed → show ClarificationPrompt
  │     ├─ success → setResults(data.results) → ResultsGrid renders RepoCards
  │     └─ error → show error banner
  └─ setViewState("results" | "empty")
```

---

## Responsive Layout

| Breakpoint | Sidebar | Grid columns |
|---|---|---|
| < 640px (mobile) | Hidden (slide-in overlay) | 1 |
| 640–1023px (tablet) | Hidden (slide-in overlay) | 2 |
| ≥ 1024px (desktop) | Visible (fixed 240px) | 3 |

The hamburger button in `Topbar` is visible below 960px and toggles `sidebarOpen` state passed down to `Sidebar`.

---

## Animation Patterns

### Staggered card entrance
```ts
// In RepoCard
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.06 }}
>
```

### Page-level view transitions
```tsx
<AnimatePresence mode="wait">
  {viewState === "empty" && <motion.div key="empty" ... />}
  {viewState === "results" && <motion.div key="results" ... />}
</AnimatePresence>
```

### Card hover lift
```ts
<motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
```

---

## Accessibility

- All icon-only buttons have `aria-label`.
- All form inputs have associated `<label htmlFor>`.
- Error messages use `role="alert"`.
- Clickable `RepoCard` elements expose `role="button"` and `tabIndex={0}` with `onKeyDown` handling Enter/Space.
- Focus rings: `focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none`.
- Sidebar overlay has `aria-hidden="true"` when closed.
