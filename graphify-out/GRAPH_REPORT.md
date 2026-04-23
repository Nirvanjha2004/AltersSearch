# Graph Report - C:\Users\nirva\Desktop\personal projects\AltersSearch  (2026-04-23)

## Corpus Check
- 12 files · ~2,045 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 45 nodes · 65 edges · 11 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `AgentResponse` - 8 edges
2. `ingest_github_repos()` - 8 edges
3. `process_search_query()` - 7 edges
4. `SearchRequest` - 7 edges
5. `QueryAssessment` - 5 edges
6. `vector_search()` - 5 edges
7. `SearchResult` - 5 edges
8. `_build_llm()` - 3 edges
9. `_build_embeddings_model()` - 3 edges
10. `_embed_query_text()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `process_search_query()` --calls--> `AgentResponse`  [INFERRED]
  C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\agent.py → C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\schemas.py
- `process_search_query()` --calls--> `vector_search()`  [INFERRED]
  C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\agent.py → C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\database.py
- `search()` --calls--> `process_search_query()`  [INFERRED]
  C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\main.py → C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\agent.py
- `Build a Supabase client from environment variables.` --uses--> `SearchResult`  [INFERRED]
  C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\database.py → C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\schemas.py
- `Search Supabase pgvector index using an embedding and optional domain metadata f` --uses--> `SearchResult`  [INFERRED]
  C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\database.py → C:\Users\nirva\Desktop\personal projects\AltersSearch\backend\app\schemas.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.44
Nodes (8): QueryAssessment, Structured output returned by the LLM classifier., Create a fast Groq-backed chat model for classification., Build an embeddings model for vector search queries., Analyze the query and return either clarification-needed or vector search result, BaseModel, AgentResponse, SearchRequest

### Community 1 - "Community 1"
Cohesion: 0.39
Nodes (8): _build_insert_payload(), _embed_text(), _fetch_top_repositories(), _get_embeddings_model(), _get_supabase_client(), ingest_github_repos(), Fetch top GitHub repos, embed descriptions, and store them in Supabase repos tab, _run()

### Community 2 - "Community 2"
Cohesion: 0.43
Nodes (5): _build_embeddings_model(), _build_llm(), _embed_query_text(), process_search_query(), search()

### Community 3 - "Community 3"
Cohesion: 0.48
Nodes (6): _get_supabase_client(), _normalize_result_row(), Search Supabase pgvector index using an embedding and optional domain metadata f, Build a Supabase client from environment variables., vector_search(), SearchResult

### Community 4 - "Community 4"
Cohesion: 0.83
Nodes (3): callSearchApi(), handleClarificationSubmit(), handleInitialSearch()

### Community 5 - "Community 5"
Cohesion: 1.0
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **1 isolated node(s):** `Fetch top GitHub repos, embed descriptions, and store them in Supabase repos tab`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 5`** (2 nodes): `ClarificationPrompt.tsx`, `ClarificationPrompt()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `ResultCard.tsx`, `ResultCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `SearchBar.tsx`, `SearchBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (1 nodes): `config.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `process_search_query()` connect `Community 2` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `vector_search()` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `AgentResponse` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `AgentResponse` (e.g. with `QueryAssessment` and `Structured output returned by the LLM classifier.`) actually correct?**
  _`AgentResponse` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `process_search_query()` (e.g. with `AgentResponse` and `vector_search()`) actually correct?**
  _`process_search_query()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `SearchRequest` (e.g. with `QueryAssessment` and `Structured output returned by the LLM classifier.`) actually correct?**
  _`SearchRequest` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `QueryAssessment` (e.g. with `AgentResponse` and `SearchRequest`) actually correct?**
  _`QueryAssessment` has 2 INFERRED edges - model-reasoned connections that need verification._