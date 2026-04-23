import asyncio
import json
import os
from functools import lru_cache
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from pydantic import BaseModel, Field

from app.database import vector_search
from app.logger import logger
from app.schemas import SearchRequest

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

GATEKEEPER_SYSTEM_PROMPT = """\
You are a search query classifier for AltersSearch, a software engineering repository search engine.
Respond ONLY with a valid JSON object. No prose, no markdown fences, no explanation.

CLASSIFICATION RULES:
1. CLEAR query: contains a technical noun, tool name, framework, language, or action verb
   (e.g. "parse csv python", "deploy docker", "react state management", "cli tool rust").
   → Set is_clear=true, write an optimized_query, leave clarification_question as "".

2. VAGUE query: greetings, single generic adjectives, or meta-talk with no technical signal
   (e.g. "hi", "cool", "good stuff", "something nice").
   → Set is_clear=false, leave optimized_query as "", write ONE short clarification_question.

3. SECOND-ATTEMPT (input starts with "Original intent:"): the user has already been asked once.
   You MUST set is_clear=true regardless of vagueness. Build the best possible optimized_query
   from the original intent and any clarification provided. NEVER ask again.

OUTPUT FORMAT (strict — no deviations):
{"is_clear": true, "optimized_query": "...", "clarification_question": ""}
{"is_clear": false, "optimized_query": "", "clarification_question": "What kind of project are you looking for?"}

EXAMPLES:
Input: "build a rest api with fastapi"
Output: {"is_clear": true, "optimized_query": "FastAPI REST API Python backend framework", "clarification_question": ""}

Input: "cool"
Output: {"is_clear": false, "optimized_query": "", "clarification_question": "What kind of project are you looking for — a library, CLI tool, or something else?"}

Input: "Original intent: give me some repos. Clarification: why do you ask?"
Output: {"is_clear": true, "optimized_query": "popular open source repositories trending software projects", "clarification_question": ""}

Input: "Original intent: cool projects. Clarification: I want an ai tool"
Output: {"is_clear": true, "optimized_query": "generative AI tools machine learning frameworks open source", "clarification_question": ""}
"""


# ---------------------------------------------------------------------------
# Pydantic schema
# ---------------------------------------------------------------------------

class QueryAssessment(BaseModel):
    is_clear: bool = Field(
        description="Whether the query has enough technical signal to search."
    )
    clarification_question: str = Field(
        description="One short clarification question when is_clear=false. Empty string otherwise."
    )
    optimized_query: str = Field(
        description="Improved, keyword-rich search query preserving user intent. Empty string when is_clear=false."
    )


# ---------------------------------------------------------------------------
# Cached singletons — avoid rebuilding models on every request
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_llm():
    """Build the Groq LLM once and reuse it across requests."""
    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,          # deterministic — critical for classifiers
        max_tokens=150,         # gatekeeper never needs more
    )
    return llm.with_structured_output(QueryAssessment)


@lru_cache(maxsize=1)
def _get_embeddings_model() -> HuggingFaceEmbeddings:
    """Build the HuggingFace embeddings model once and reuse it."""
    model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    return HuggingFaceEmbeddings(model_name=model_name)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_second_attempt(query: str) -> bool:
    return query.strip().lower().startswith("original intent:")


def _parse_raw_fallback(raw: str) -> QueryAssessment:
    """
    Last-resort parser when structured_output fails.
    Strips markdown fences and tries json.loads before giving up.
    """
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        # parts[1] is the content inside the fences
        cleaned = parts[1].lstrip("json").strip() if len(parts) > 1 else cleaned

    try:
        data = json.loads(cleaned)
        return QueryAssessment(**data)
    except (json.JSONDecodeError, TypeError, ValueError):
        logger.warning("Fallback JSON parse failed, using raw text as query.")
        return QueryAssessment(
            is_clear=True,
            clarification_question="",
            optimized_query=cleaned[:300],  # cap length
        )


async def _embed_text(text: str) -> list[float]:
    """Embed a string using the cached embeddings model (runs in thread pool)."""
    model = _get_embeddings_model()

    # All HuggingFaceEmbeddings variants are sync; offload to thread pool.
    if hasattr(model, "embed_query"):
        vector = await asyncio.to_thread(model.embed_query, text)
    elif hasattr(model, "encode"):
        raw = await asyncio.to_thread(model.encode, text)
        vector = raw.tolist() if hasattr(raw, "tolist") else list(raw)
    else:
        raise RuntimeError("Embeddings model has no supported method (embed_query / encode).")

    return list(vector)


# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------

async def _run_gatekeeper(query: str) -> QueryAssessment:
    """
    Call the LLM gatekeeper. Returns a QueryAssessment.
    Falls back gracefully on any LLM or parsing error.
    """
    gatekeeper = _get_llm()
    messages = [
        SystemMessage(content=GATEKEEPER_SYSTEM_PROMPT),
        HumanMessage(content=query),
    ]

    try:
        assessment: QueryAssessment = await gatekeeper.ainvoke(messages)
        return assessment
    except Exception:
        logger.exception("Gatekeeper LLM call failed for query='{}'. Using fallback.", query)

    # Hard fallback: treat the query as-is
    return QueryAssessment(
        is_clear=True,
        clarification_question="",
        optimized_query=query,
    )


async def process_search_query(request: SearchRequest) -> dict[str, Any]:
    """
    Full pipeline:
      1. Gatekeeper — classify and optimise the query.
      2. If unclear and first attempt — return clarification request.
      3. Embed the optimised query.
      4. Vector search and return results.
    """
    query = request.query.strip()
    logger.info("process_search_query started query='{}'", query)

    # --- Step 1: Gatekeeper ---
    assessment = await _run_gatekeeper(query)

    logger.info(
        "Gatekeeper result query='{}' is_clear={} optimized_query='{}'",
        query,
        assessment.is_clear,
        assessment.optimized_query,
    )

    # --- Step 2: Clarification gate ---
    # Only ask once. If this is already a second attempt, override and search.
    if not assessment.is_clear and not _is_second_attempt(query):
        logger.info("Clarification needed for query='{}'", query)
        return {
            "status": "clarification_needed",
            "message": assessment.clarification_question,
            "results": [],
        }

    # --- Step 3: Resolve the final search query ---
    # Priority: LLM optimized → extract clarification part → raw query
    optimized_query = (
        assessment.optimized_query.strip()
        or _extract_clarification(query)
        or query
    )
    logger.info("Final search query='{}'", optimized_query)

    # --- Step 4: Embed + vector search ---
    try:
        embedding = await _embed_text(optimized_query)
        logger.debug("Embedding dimension={} for query='{}'", len(embedding), optimized_query)

        results = await asyncio.to_thread(vector_search, query_embedding=embedding)
        logger.info("Vector search done query='{}' result_count={}", optimized_query, len(results))
    except Exception:
        logger.exception("Search pipeline failed for query='{}'", optimized_query)
        return {
            "status": "error",
            "message": "Search failed. Please try again.",
            "results": [],
        }

    return {
        "status": "success",
        "message": f"{len(results)} result(s) found.",
        "results": results,
    }


# ---------------------------------------------------------------------------
# Private utility
# ---------------------------------------------------------------------------

def _extract_clarification(query: str) -> str:
    """
    For 'Original intent: X. Clarification: Y' strings,
    extract the clarification part as a fallback query fragment.
    """
    if "Clarification:" in query:
        part = query.split("Clarification:")[-1].strip()
        # Only use it if it has some substance
        if len(part) > 3:
            return part
    return ""