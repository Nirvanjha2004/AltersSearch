# AltersSearch

> A developer-friendly code search and repository insight tool.

## Table of Contents

- **Project Overview**: What AltersSearch is and why it exists
- **Architecture**: High-level components and responsibilities
- **Repository Layout**: Key folders and files
- **Local Setup**: Environment, running locally, and Docker
- **Usage**: API endpoints and examples
- **Development**: Tests, linting, and workflows
- **Deployment**: Docker and production notes
- **Future Enhancements**: Planned improvements and roadmap
- **Contributing**: How to help
- **License & Contact**: Project license and maintainer

## Project Overview

AltersSearch is a developer-facing project that indexes and searches code and repository metadata to provide fast repository insights and search results. It combines a Next.js frontend, a Python backend for search pipelines and ingestion, and a small Node.js `repo-api` service to fetch additional GitHub repository details on demand.

Goals:

- Fast, focused code search UX
- Lightweight repository metadata API with caching
- Modular ingestion and workers for background sync

Use cases:

- Quickly preview repository README, languages, and contributors
- Run search queries across ingested code and metadata
- Integrate results into a web UI for exploration

## Architecture

High-level components:

- **frontend/** — Next.js app that provides the UI and client-side integration with backend APIs.
- **backend/** — Python FastAPI (or similar) app that hosts the search pipeline, APIs, and ingestion logic. Contains the `app/` package with core services and a `myenv/` virtual environment (for local development).
- **repo-api/** — Small Node.js Express service that fetches GitHub repository details (README, languages, contributors) with caching and rate-limit handling.
- **workers/** — Background jobs for ingesting data (e.g., `github_ingest.py`).
- **supabase/** — SQL migrations and database schema used for persistent storage (if applicable).
- **docker-compose.yml** — Orchestrates services for local development.

Data flow (simplified):

1. Worker ingests repository content and stores/updates index.
2. Backend APIs query the index and return ranked results.
3. Frontend queries backend APIs and displays results; requests extra repo details from `repo-api` as needed.

## Repository Layout

- `frontend/` — Next.js UI
- `backend/` — Python backend and search pipeline (see `backend/app/`)
- `repo-api/` — Node.js Express helper service for repository metadata
- `workers/` — Background ingestion scripts
- `supabase/migrations/` — SQL migrations
- `graphify-out/` — Generated architecture/graph reports

Key files:

- `backend/app/main.py` — Backend server entry
- `backend/app/search_pipeline.py` — Search pipeline and ranking logic
- `repo-api/src/server.js` — Repo metadata API server
- `workers/github_ingest.py` — GitHub ingestion worker
- `docker-compose.yml` — Local orchestration

## Local Setup

Prerequisites:

- Node.js 18+ and npm/yarn
- Python 3.10+ and `venv` (or use the provided `backend/myenv` for reference)
- Docker & Docker Compose (optional, recommended for full-stack local run)

Environment variables (examples):

- `GITHUB_TOKEN` — GitHub API token (optional but recommended to avoid strict rate limits)
- `FRONTEND_ORIGIN` — Allowed CORS origin for `repo-api` (defaults to `http://localhost:3000`)
- `PORT` — Port for `repo-api` (defaults to `4000`)
- `REPO_CACHE_TTL_MS` — Milliseconds to cache repo API responses (defaults to 5 minutes)

Backend (Python) setup (recommended):

1. Create and activate virtualenv:

```bash
python -m venv .venv
source .venv/Scripts/activate  # Windows: .venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Run the backend (example):

```bash
# from backend/
python -m app.main
```

Repo API (Node) setup:

1. Install dependencies and run:

```bash
cd repo-api
npm install
node src/server.js
```

Or run with environment variables:

```bash
GITHUB_TOKEN=ghp_xxx PORT=4000 node src/server.js
```

Frontend (Next.js):

```bash
cd frontend
npm install
npm run dev
```

Docker (all services):

```bash
docker compose up --build
```

## Usage

Repo API endpoints:

- `GET /api/repo/:owner/:repo` — Returns JSON with `repo`, `languages`, `contributors`, and `readme` fields. Uses caching to limit GitHub API calls.
- `GET /health` — Simple health check (returns `{ status: 'ok' }`).

Example request:

```bash
curl http://localhost:4000/api/repo/vercel/next.js
```

Search API (backend):

- Check `backend/app/main.py` and `backend/app/search_pipeline.py` for available routes and query parameters. Typical endpoints may include `/search` with a `q` parameter.

## Development

- Run linters and formatters as configured in the workspace.
- Add tests under `backend/tests/` and `frontend/__tests__/` where applicable.
- Recreate migrations under `supabase/migrations/` when altering schema.

Testing (example):

```bash
# run Python tests
pytest -q

# run frontend tests
cd frontend && npm test
```

## Deployment

- This repo uses container-friendly services. Build and push images for each service and deploy with your chosen orchestrator (Kubernetes, Docker Compose on server, or cloud services).
- Ensure `GITHUB_TOKEN` is provisioned in the deployment environment to avoid GitHub rate limits.

## Observability & Monitoring

- Add structured logs (see `backend/app/logger.py`) and propagate tracing/context where helpful.
- Export metrics for request rates, cache hits/misses, and ingestion status.

## Future Enhancements (Roadmap)

Short-term:

- Improve search ranking by integrating a vector database for semantic search.
- Add pagination and rate-limited endpoints for large contributor/language lists.
- Harden GitHub API error handling and exponential backoff for retries.
- Add unit and integration tests for the `repo-api` endpoints.

Medium-term:

- Add user authentication and preferences for saved searches.
- Implement incremental ingestion and webhook-driven updates from GitHub.
- Add more detailed repository enrichment (license detection, dependency graphs).
- Integrate a hosted vector DB (e.g., Milvus, Pinecone, Weaviate) for semantic similarity and contextual search.

Long-term / aspirational:

- Multi-source ingestion (GitLab, Bitbucket, private Git hosts).
- Real-time collaboration features in the frontend (annotations, shared queries).
- Built-in code intelligence (cross-repo symbol lookup, precise definitions).
- Advanced analytics/insights dashboard with usage, errors, and query analytics.

## Contributing

- Fork the repo, create a feature branch, and open a pull request against `main`.
- Follow the code style and add tests for new features.
- Open issues for bugs or suggestion; label with `enhancement` for roadmap items.

## License & Contact

- License: Add your chosen license file (e.g., `LICENSE`) to the repository.
- Maintainer: Open issues or reach out via the repository's GitHub page.

---

If you'd like, I can also:

- Add a `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.
- Scaffold CI (GitHub Actions) for tests and linting.
- Add a minimal README badge set (build, coverage).

Created README for the project. See [README.md](README.md) for the full content.
