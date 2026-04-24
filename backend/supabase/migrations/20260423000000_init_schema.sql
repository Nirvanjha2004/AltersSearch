CREATE EXTENSION IF NOT EXISTS vector;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE repos (
    -- ── Identity ─────────────────────────────
    github_id BIGINT,
    repo_name TEXT NOT NULL,
    name TEXT,
    full_name TEXT,
    url TEXT PRIMARY KEY,
    git_url TEXT,
    ssh_url TEXT,
    clone_url TEXT,
    api_url TEXT,
    homepage TEXT,

    -- ── Description / content ───────────────
    description TEXT,
    topics TEXT[],

    -- ── Owner ───────────────────────────────
    owner_login TEXT,
    owner_id BIGINT,
    owner_type TEXT,
    owner_avatar_url TEXT,

    -- ── Stats ───────────────────────────────
    stargazers_count INT,
    watchers_count INT,
    forks_count INT,
    open_issues_count INT,
    size INT,

    -- ── Language / tech ─────────────────────
    language TEXT,
    domain TEXT,

    -- ── Flags ───────────────────────────────
    is_fork BOOLEAN,
    is_private BOOLEAN,
    is_archived BOOLEAN,
    is_disabled BOOLEAN,
    is_template BOOLEAN,
    has_issues BOOLEAN,
    has_projects BOOLEAN,
    has_wiki BOOLEAN,
    has_pages BOOLEAN,
    has_downloads BOOLEAN,
    has_discussions BOOLEAN,
    allow_forking BOOLEAN,

    -- ── License ─────────────────────────────
    license_key TEXT,
    license_name TEXT,
    license_spdx_id TEXT,

    -- ── Branch / visibility ────────────────
    default_branch TEXT,
    visibility TEXT,

    -- ── Timestamps ─────────────────────────
    github_created_at TIMESTAMP,
    github_updated_at TIMESTAMP,
    github_pushed_at TIMESTAMP,

    -- ── Embedding (IMPORTANT) ──────────────
    embedding VECTOR(384)
);

CREATE TABLE IF NOT EXISTS ingestion_queue (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    query TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    query TEXT NOT NULL,
    domain TEXT,
    returned_results_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
