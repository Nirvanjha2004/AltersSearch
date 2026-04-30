# AltersSearch

> A full-stack open source search app for discovering software repositories, surfacing metadata, and answering search queries with AI-assisted routing.

## What This Project Does

AltersSearch combines a modern search UI, a FastAPI backend, a Supabase vector index, and supporting repo metadata services to help users discover relevant open-source projects quickly.

At a high level, the app can:

- route queries between local vector search and web search
- enrich ambiguous entities with web lookup and LLM synthesis
- rank repositories by stars, forks, recency, language, and archived/fork filters
- fetch repository metadata like README, languages, and contributors

## Tech Stack

Frontend:

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- React Markdown, `remark-gfm`, `rehype-raw`, `rehype-slug`
- Lucide React icons

Backend:

- FastAPI
- Uvicorn
- Pydantic v2
- LangChain Core
- LangChain Groq
- LangChain Hugging Face
- sentence-transformers
- httpx
- loguru
- Supabase Python client

Supporting services:

- Node.js + Express repo API in `repo-api/`
- GitHub REST API for repository metadata
- Serper.dev Google Search API for web lookup
- Supabase Postgres + pgvector for semantic search

Infrastructure:

- Docker and Docker Compose
- SQL migrations in `backend/supabase/migrations/`
- Background ingestion scripts in `workers/`

## Architecture

The repository is organized around three primary flows:

1. Search requests start in the Next.js frontend.
2. The FastAPI backend routes the query, either to vector search or web search, and may return a clarification prompt when the query is ambiguous.
3. Repo metadata is fetched from GitHub and merged into search results or repo detail views.

The most important backend pieces are:

- `backend/app/main.py` for API routes
- `backend/app/search_pipeline.py` for query routing, web search, enrichment, and LLM synthesis
- `backend/app/database.py` for Supabase pgvector retrieval
- `backend/app/schemas.py` for request and response models
- `backend/app/logger.py` for structured logging

The frontend centers on:

- `frontend/src/app/page.tsx` for the main search experience
- `frontend/src/components/` for the result cards, filters, sidebar, search bar, and answer/clarification UI

## Repository Layout

- `frontend/` - Search UI and client-side filtering/sorting
- `backend/` - FastAPI app, search pipeline, database access, and API logic
- `repo-api/` - Standalone Express repo metadata helper service
- `workers/` - Ingestion and sync scripts
- `supabase/` - Database migrations
- `docker-compose.yml` - Local orchestration for the stack
- `graphify-out/` - Architecture graph artifacts and reports

Important files:

- `frontend/src/app/page.tsx` - main application shell and search flow
- `frontend/src/components/ResultCard.tsx` - repository result presentation
- `backend/app/main.py` - `/api/search` and repo metadata endpoint
- `backend/app/search_pipeline.py` - router, enrichment, and web search logic
- `backend/app/database.py` - Supabase vector query implementation
- `backend/app/schemas.py` - request and response schemas
- `repo-api/src/server.js` - Express repo metadata service
- `workers/github_ingest.py` - Background ingestion worker. It polls the `ingestion_queue` table, fetches repos from the GitHub Search API, prepares a text document for each repo by concatenating the repository description, name, and topics, computes a 384-dimensional semantic embedding via a local `sentence-transformers` model (`all-MiniLM-L6-v2`), and upserts the complete metadata and vector into the Supabase `repos` table.

## Current Features

- AI-assisted query routing between `web_search`, `vector_search`, and `clarify`
- Clarification flow when the query has too little technical signal
- Web enrichment for unknown entities before vector search
- Repo result filtering by domain, language, archived state, and fork state
- Sorting by stars, forks, last pushed time, or creation time
- Recent searches and theme persistence in local storage
- GitHub repository detail fetching with README, languages, and contributors

## Local Setup

Prerequisites:

- Node.js 20+ recommended for the frontend and repo API
- Python 3.10+ for the backend and workers
- Docker and Docker Compose if you want to run the full stack locally

Environment variables you will likely need:

- `GROQ_API_KEY` - required for LLM routing, enrichment, and answer synthesis
- `GROQ_MODEL` - optional Groq model override, defaults to `llama-3.3-70b-versatile`
- `SERPER_API_KEY` - optional but needed for live web enrichment/search
- `EMBEDDING_MODEL` - optional Hugging Face embedding model override
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` - Supabase auth key
- `SUPABASE_VECTOR_SEARCH_RPC` - optional RPC name, defaults to `match_repos_vector`
- `VECTOR_MATCH_COUNT` - number of vector search results to return
- `GITHUB_TOKEN` - optional GitHub token for repo metadata endpoints
- `PORT` - repo-api port, defaults to `4000`
- `FRONTEND_ORIGIN` - allowed CORS origin for repo-api

Backend setup:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Repo metadata service setup:

```bash
cd repo-api
npm install
npm run dev
```

Frontend setup:

```bash
cd frontend
npm install
npm run dev
```

Docker Compose:

```bash
docker compose up --build
```

## API Endpoints

Backend:

- `POST /api/search` - accepts `SearchRequest` with `query` and optional `context`
- `GET /api/repo/{owner}/{repo}` - returns repo metadata, languages, contributors, and README text

Repo API:

- `GET /api/repo/:owner/:repo` - same repo metadata shape in the Node helper service
- `GET /health` - basic health check

Example request:

```bash
curl -X POST http://localhost:8000/api/search ^
	-H "Content-Type: application/json" ^
	-d "{\"query\":\"python csv parser\"}"
```

## Development Notes

- The frontend expects the backend on `http://localhost:8000`.
- Search results are rendered in the client and then refined with local sorting and filtering.
- The repo metadata result cards expect extra GitHub fields such as stars, forks, language, topics, archived state, and owner information.
- Supabase RPC changes should be tracked in `backend/supabase/migrations/` when the repository schema changes.

Suggested checks:

```bash
cd frontend
npm run lint

cd backend
python -m compileall app
```

## Deployment

- Use Docker Compose for local stack validation.
- For production, run the FastAPI app behind a process manager or container orchestrator and provide the required environment variables.
- Ensure rate-limited or secret-backed integrations such as Groq, Serper, Supabase, and GitHub are injected at deploy time.

## Future Enhancements

Near-term:

- Unify repo metadata fetching so the backend and the Node helper service share one source of truth.
- Add retries, timeouts, and cache headers around GitHub and web search calls.
- Make repo-api and backend repo routes return a consistent response schema.
- Add automated tests for query routing, clarification handling, and vector search normalization.

Mid-term:

- Add authentication and saved search history.
- Add incremental ingestion and scheduled refresh for indexed repositories.
- Expand repo enrichment with license detection, dependency signals, and topic summaries.
- Add pagination and faceted filtering for very large result sets.
- Improve semantic retrieval with richer embeddings or hybrid lexical + vector ranking.

Long-term:

- Support multi-source ingestion from GitHub, GitLab, Bitbucket, and self-hosted Git providers.
- Add collaborative features such as shared searches, annotations, and bookmarks.
- Add analytics for query quality, routing accuracy, and result click-through.
- Add a dedicated admin dashboard for ingestion health, cache state, and search performance.

## Contributing

- Fork the repository and create a feature branch.
- Keep changes focused and add tests when behavior changes.
- Open a pull request against `main`.

## License

No license file is currently present in the repository. Add one before publishing or distributing the project externally.
