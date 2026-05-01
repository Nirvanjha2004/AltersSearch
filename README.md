# AltersSearch

> A full-stack AI-powered GitHub repository search app. Find the right open-source project instantly using natural language — powered by vector search, LLM query routing, and Supabase pgvector.

---

## What It Does

AltersSearch lets developers search GitHub repositories using plain English. Type something like "production-ready FastAPI backend with auth and Docker" and the app routes your query through an AI pipeline that decides whether to run a semantic vector search, a live web search, or ask a clarifying question.

Key capabilities:

- Natural language → GitHub repository search
- AI query routing (vector search vs. web search vs. clarification)
- Supabase pgvector semantic index over ingested repositories
- Supabase Auth for user registration and login
- Collapsible sidebar with chat history (searches saved per session)
- Smart search chips — pre-built developer-focused query shortcuts
- Repository detail pages with README, languages, and contributors
- Dark, minimal premium UI inspired by Claude and Linear

---

## Tech Stack

### Frontend (`frontend/`)

| Concern | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v3 + CSS custom properties |
| Animation | Framer Motion v12 |
| Icons | Lucide React |
| State | React `useState` / `useContext` |
| Auth | Supabase Auth via custom `AuthContext` |
| Markdown | `react-markdown`, `remark-gfm`, `rehype-raw` |

### Backend (`backend/`)

| Concern | Choice |
|---|---|
| Framework | FastAPI + Uvicorn |
| Validation | Pydantic v2 |
| LLM routing | LangChain + Groq (`llama-3.3-70b-versatile`) |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) |
| Vector DB | Supabase Postgres + pgvector |
| Auth provider | Supabase Auth (Admin API) |
| HTTP client | httpx |
| Logging | loguru |

### Supporting Services

- **Supabase** — Postgres database, pgvector index, and Auth
- **Serper.dev** — Google Search API for live web enrichment
- **GitHub REST API** — repository metadata, README, contributors, languages
- **Docker + Docker Compose** — local and production orchestration

---

## Repository Layout

```
alterssearch/
├── frontend/               # Next.js App Router UI
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Main search page
│   │   │   ├── login/page.tsx      # Sign in
│   │   │   ├── register/page.tsx   # Sign up
│   │   │   ├── layout.tsx          # Root layout + fonts
│   │   │   └── globals.css         # Design tokens + base styles
│   │   ├── components/
│   │   │   ├── Sidebar.tsx         # Collapsible sidebar with chat history
│   │   │   ├── SearchChips.tsx     # Smart search chip groups
│   │   │   ├── RepoCard.tsx        # Repository result card
│   │   │   ├── ResultsGrid.tsx     # Responsive results grid
│   │   │   ├── SkeletonCard.tsx    # Loading placeholder
│   │   │   └── repo-detail/        # Repo detail sub-components
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx     # Auth state + token refresh
│   │   ├── hooks/
│   │   │   └── useSearchSuggestions.ts  # Smart chip query mappings
│   │   ├── lib/
│   │   │   ├── authApi.ts          # Auth API wrappers
│   │   │   ├── cn.ts               # clsx + tailwind-merge utility
│   │   │   └── tokenUtils.ts       # JWT decode helpers
│   │   └── types/index.ts          # Shared TypeScript types
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── main.py             # API routes + CORS + auth router
│   │   ├── auth.py             # /api/auth/* routes (Supabase Admin API)
│   │   ├── search_pipeline.py  # Query routing, web search, LLM synthesis
│   │   ├── database.py         # Supabase pgvector retrieval
│   │   ├── schemas.py          # Pydantic request/response models
│   │   ├── agent.py            # LangChain agent logic
│   │   ├── config.py           # Environment config
│   │   └── logger.py           # Loguru setup
│   ├── workers/
│   │   └── github_ingest.py    # Repo ingestion + embedding worker
│   ├── supabase/
│   │   └── migrations/         # SQL schema migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env                    # Local secrets (never commit)
│
├── repo-api/               # Express repo metadata helper (optional)
│   └── src/server.js
│
├── docker-compose.yml
└── README.md
```

---

## Design System

The UI uses a dark, minimal premium aesthetic with these tokens (defined in `globals.css`):

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0D0D0D` | Page background |
| `--bg-surface` | `#1A1A1A` | Cards, sidebar |
| `--bg-elevated` | `#222222` | Hover states, inputs |
| `--border` | `#2A2A2A` | Borders |
| `--accent` | `#FF7849` | Primary orange accent |
| `--text-primary` | `#EAEAEA` | Headings, body |
| `--text-secondary` | `#A0A0A0` | Labels, metadata |
| `--text-muted` | `#606060` | Placeholders, hints |

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.11+
- A Supabase project (free tier works)
- A Groq API key (free at [console.groq.com](https://console.groq.com))
- Optional: Serper.dev API key for live web search

### 1. Clone and configure

```bash
git clone https://github.com/your-username/alterssearch.git
cd alterssearch
```

Copy the example env files and fill in your keys:

```bash
cp backend/.env.example backend/.env   # if you have one, otherwise edit backend/.env directly
cp frontend/.env.local.example frontend/.env.local
```

**`backend/.env`** — required variables:

```env
GROQ_API_KEY=your_groq_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GITHUB_TOKEN=your_github_token          # optional but recommended
SERPER_API_KEY=your_serper_key          # optional, enables web search
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

**`frontend/.env.local`** — required variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. You can verify it at `http://localhost:8000/docs`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### 4. (Optional) Docker Compose — full stack

```bash
docker compose up --build
```

This starts the backend on port 8000 and the frontend on port 3000.

---

## API Reference

### Auth endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account. Body: `{ email, password }` |
| `POST` | `/api/auth/login` | Sign in. Returns `{ accessToken, refreshToken }` |
| `POST` | `/api/auth/refresh` | Rotate tokens. Body: `{ refreshToken }` |
| `POST` | `/api/auth/logout` | Revoke session. Body: `{ refreshToken }` |

### Search endpoint

```
POST /api/search
Content-Type: application/json

{ "query": "production-ready FastAPI backend with Docker" }
```

Response:

```json
{
  "status": "success",
  "results": [
    {
      "repo_name": "tiangolo/full-stack-fastapi-template",
      "description": "...",
      "url": "https://github.com/...",
      "language": "Python",
      "stargazers_count": 28000,
      "topics": ["fastapi", "docker", "postgresql"]
    }
  ]
}
```

Status values: `success` | `clarification_needed` | `error`

### Repo detail endpoint

```
GET /api/repo/{owner}/{repo}
```

Returns: `{ repo, languages, contributors, readme }`

---

## Deploying the Backend

The backend is a standard FastAPI app containerized with Docker. Here are the best options ranked by ease:

### Option 1 — Railway (recommended, easiest)

Railway detects the `Dockerfile` automatically and handles everything.

1. Go to [railway.app](https://railway.app) and create a new project
2. Click **Deploy from GitHub repo** → select your repo
3. Set the **Root Directory** to `backend`
4. Add environment variables in the Railway dashboard (same as your `backend/.env`)
5. Railway assigns a public URL like `https://alterssearch-backend.up.railway.app`
6. Update `NEXT_PUBLIC_API_URL` in your frontend deployment to that URL

Cost: free tier gives 500 hours/month, $5/month for always-on.

### Option 2 — Render

1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repo, set **Root Directory** to `backend`
3. Set **Runtime** to Docker (it picks up the `Dockerfile`)
4. Add all environment variables
5. Deploy — Render gives you a `https://your-app.onrender.com` URL

Cost: free tier spins down after inactivity (cold starts ~30s). Paid plan ($7/month) keeps it warm.

### Option 3 — Fly.io

Good for always-on low-latency deployments.

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

cd backend
fly launch          # detects Dockerfile, creates fly.toml
fly secrets set GROQ_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
fly deploy
```

Cost: free allowance covers a small VM. ~$2–5/month for a persistent instance.

### Option 4 — Google Cloud Run (serverless)

Best if you want zero cold-start cost and pay-per-request.

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT/alterssearch-backend ./backend

# Deploy
gcloud run deploy alterssearch-backend \
  --image gcr.io/YOUR_PROJECT/alterssearch-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GROQ_API_KEY=...,SUPABASE_URL=...
```

Cost: first 2M requests/month free, then ~$0.40 per million.

### Option 5 — AWS App Runner / ECS

For teams already on AWS. Push the Docker image to ECR and deploy via App Runner (simplest) or ECS Fargate (more control).

---

### After deploying the backend

Update your frontend environment variable to point at the live backend URL:

**On Vercel** (recommended for the frontend):

1. Go to your Vercel project → Settings → Environment Variables
2. Set `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app` (or wherever you deployed)
3. Redeploy the frontend

**Locally** — update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

---

## Deploying the Frontend

The frontend is a standard Next.js app. The easiest option is Vercel:

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select your repo
3. Set **Root Directory** to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url`
5. Deploy

Alternatively use Netlify, Cloudflare Pages, or any platform that supports Next.js.

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | LLM routing and synthesis |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (bypasses RLS) |
| `GITHUB_TOKEN` | Recommended | Raises GitHub API rate limit from 60 to 5000 req/hr |
| `SERPER_API_KEY` | Optional | Enables live Google web search |
| `EMBEDDING_MODEL` | Optional | Defaults to `all-MiniLM-L6-v2` |
| `GROQ_MODEL` | Optional | Defaults to `llama-3.3-70b-versatile` |
| `SUPABASE_VECTOR_SEARCH_RPC` | Optional | Defaults to `match_repos_vector` |
| `VECTOR_MATCH_COUNT` | Optional | Number of vector results, defaults to `12` |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL, e.g. `http://localhost:8000` |

---

## Database Setup (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable the `pgvector` extension: **Database → Extensions → vector**
3. Run the migrations in order:

```bash
# In the Supabase SQL editor, run each file in order:
backend/supabase/migrations/20260423000000_init_schema.sql
backend/supabase/migrations/20260424130000_fix_match_repos_rpc.sql
backend/supabase/migrations/20260424133000_resolve_match_repos_overload.sql
```

4. Copy your **Project URL** and **service_role key** from **Settings → API** into `backend/.env`

---

## Ingesting Repositories

The worker at `backend/workers/github_ingest.py` fetches repos from GitHub, generates embeddings, and upserts them into Supabase.

```bash
cd backend
python workers/github_ingest.py
```

The worker:
- Polls the `ingestion_queue` table in Supabase
- Fetches repo metadata from the GitHub Search API
- Generates 384-dimensional embeddings using `all-MiniLM-L6-v2`
- Upserts metadata + vector into the `repos` table

---

## Contributing

1. Fork the repo and create a feature branch
2. Keep changes focused — one concern per PR
3. Add tests when changing behavior
4. Open a pull request against `main`

---

## License

No license file is currently present. Add one before publishing or distributing externally.
