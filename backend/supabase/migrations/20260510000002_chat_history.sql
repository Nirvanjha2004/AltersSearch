-- Migration: chat history tables
-- Stores per-user search sessions and their results.

-- Each search session (a named entry in the sidebar)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,          -- Supabase auth user id
    title       TEXT NOT NULL,          -- first query used as title
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx
    ON chat_sessions (user_id, updated_at DESC);

-- Each message (query + results) inside a session
CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    query       TEXT NOT NULL,
    results     JSONB,                  -- serialised SearchResult[]
    answer      TEXT,                   -- web search synthesis answer
    action      TEXT,                   -- 'vector_search' | 'web_search'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx
    ON chat_messages (session_id, created_at ASC);

-- Auto-update updated_at on chat_sessions when a message is added
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE chat_sessions SET updated_at = NOW() WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_session_ts ON chat_messages;
CREATE TRIGGER trg_update_session_ts
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_session_timestamp();

-- Row Level Security: users can only see their own sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_sessions_owner ON chat_sessions;
CREATE POLICY chat_sessions_owner ON chat_sessions
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS chat_messages_owner ON chat_messages;
CREATE POLICY chat_messages_owner ON chat_messages
    USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );
