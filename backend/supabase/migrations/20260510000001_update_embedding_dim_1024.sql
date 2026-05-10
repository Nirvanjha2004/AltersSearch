-- Migration: switch embedding column to 1024 dimensions
-- Using jina-embeddings-v3 (1024d) instead of Google gemini-embedding-001.
-- Jina provides 1M free tokens with no rate limit issues for bulk ingestion.
--
-- This preserves all repo rows -- only the embedding column is replaced.
-- Run the re-embed script (backend/workers/reembed.py) after applying.

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Drop the old embedding column and recreate at 1024d
ALTER TABLE public.repos DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.repos ADD COLUMN embedding VECTOR(1024);

-- 2. Drop old RPC functions
DROP FUNCTION IF EXISTS public.match_repos_vector(vector, double precision, integer, text);
DROP FUNCTION IF EXISTS public.match_repos_vector(vector(768), double precision, integer, text);
DROP FUNCTION IF EXISTS public.match_repos(vector, double precision, integer, text);
DROP FUNCTION IF EXISTS public.match_repos(vector, real, integer, text);
DROP FUNCTION IF EXISTS public.match_repos(vector, float, integer, text);

-- 3. Recreate the RPC with the correct 1024d signature
CREATE OR REPLACE FUNCTION public.match_repos_vector(
    query_embedding vector(1024),
    match_threshold double precision DEFAULT 0.1,
    match_count integer DEFAULT 12,
    filter_domain text DEFAULT NULL
)
RETURNS TABLE (
    github_id bigint,
    repo_name text,
    full_name text,
    description text,
    url text,
    domain text,
    owner_avatar_url text,
    owner_login text,
    visibility text,
    topics text[],
    language text,
    stargazers_count integer,
    forks_count integer,
    open_issues_count integer,
    license_name text,
    github_pushed_at timestamp,
    github_created_at timestamp,
    is_archived boolean,
    is_fork boolean,
    similarity double precision
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        r.github_id,
        r.repo_name,
        r.full_name,
        r.description,
        r.url,
        r.domain,
        r.owner_avatar_url,
        r.owner_login,
        r.visibility,
        r.topics,
        r.language,
        r.stargazers_count,
        r.forks_count,
        r.open_issues_count,
        r.license_name,
        r.github_pushed_at,
        r.github_created_at,
        r.is_archived,
        r.is_fork,
        1 - (r.embedding <=> query_embedding) AS similarity
    FROM public.repos AS r
    WHERE r.embedding IS NOT NULL
      AND (filter_domain IS NULL OR r.domain = filter_domain)
      AND (1 - (r.embedding <=> query_embedding)) >= match_threshold
    ORDER BY r.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- 4. Recreate HNSW index for fast ANN search at 1024d
DROP INDEX IF EXISTS repos_embedding_idx;
CREATE INDEX repos_embedding_idx
    ON public.repos
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
