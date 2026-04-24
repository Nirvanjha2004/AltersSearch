CREATE EXTENSION IF NOT EXISTS vector;

DROP FUNCTION IF EXISTS public.match_repos(vector, double precision, integer, text);
DROP FUNCTION IF EXISTS public.match_repos(vector, real, integer, text);
DROP FUNCTION IF EXISTS public.match_repos(vector, float, integer, text);

CREATE OR REPLACE FUNCTION public.match_repos(
    query_embedding vector,
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
