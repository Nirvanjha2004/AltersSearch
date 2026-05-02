import asyncio
import json
import os
import re
import time
from functools import lru_cache
from typing import Any

import httpx
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
You are a query router for AltersSearch — a software engineering search engine.
Respond ONLY with a valid JSON object. No prose, no markdown fences.

YOUR JOB: Decide whether the user query should be:
  A) Searched on the internet (web_search)
  B) Searched in our local vector database of software repos (vector_search)
  C) Clarified before searching (clarify)

ROUTING RULES:
1. "web_search" — user asks about news, events, tutorials, documentation, "what is X", "how does X work",
   or anything that benefits from live internet results over a repo database.
   e.g. "latest llm papers", "how does RAG work", "what is langchain"

2. "vector_search" — user wants to FIND a software repo, library, tool, or project.
   e.g. "python csv parser", "react state management library", "cli tool for git"

3. "clarify" — query is too vague with zero technical signal.
   e.g. "hi", "cool", "something good"
   → Only ask once. If query starts with "Original intent:", you MUST pick web_search or vector_search.

OUTPUT FORMAT (strict):
{
  "action": "web_search" | "vector_search" | "clarify",
  "optimized_query": "keyword-rich query string (empty when action=clarify)",
  "clarification_question": "one short question (empty when action != clarify)",
  "reasoning": "one sentence why",
  "needs_enrichment": true | false   ← true if the core entity/tool name is obscure or you are unfamiliar with it
}

ENRICHMENT GUIDANCE:
Set "needs_enrichment": true when the query contains a proper noun, brand name, tool, or project
that you do not have reliable knowledge about (e.g. "unsiloed ai", "frobnicator.js", "xyzCorp SDK").
Set it to false for well-known terms (React, PostgreSQL, LangChain, etc.).

EXAMPLES:
Input: "what is a transformer model"
Output: {"action":"web_search","optimized_query":"transformer model neural network explained","clarification_question":"","reasoning":"User wants conceptual explanation, not a repo.","needs_enrichment":false}

Input: "python library to parse html"
Output: {"action":"vector_search","optimized_query":"Python HTML parser library BeautifulSoup scraping","clarification_question":"","reasoning":"User is looking for a specific software library.","needs_enrichment":false}

Input: "alternatives to unsiloed ai"
Output: {"action":"vector_search","optimized_query":"alternatives to unsiloed ai","clarification_question":"","reasoning":"User wants repos/tools similar to something called unsiloed ai.","needs_enrichment":true}

Input: "latest papers on llm agents 2024"
Output: {"action":"web_search","optimized_query":"LLM autonomous agents research papers 2024","clarification_question":"","reasoning":"User wants recent internet content.","needs_enrichment":false}

Input: "cool"
Output: {"action":"clarify","optimized_query":"","clarification_question":"What are you looking for — a tutorial, a library, or a project?","reasoning":"No technical signal to route on.","needs_enrichment":false}

Input: "Original intent: good tools. Clarification: just search"
Output: {"action":"vector_search","optimized_query":"popular developer tools open source software","clarification_question":"","reasoning":"Second attempt — routing on original intent.","needs_enrichment":false}
"""

WEB_SEARCH_SYSTEM_PROMPT = """\
You are a web research assistant. The user asked a question and a web search was performed.
Synthesize the search results into a clear, concise answer (3-5 sentences max).
Always cite the most relevant source at the end as: Source: [title] - [url]
If results are empty or irrelevant, say so honestly.
"""

ENRICHMENT_SYSTEM_PROMPT = """\
You are a query enrichment assistant for a software engineering search engine.
You are given:
  1. The original user query.
  2. Web search snippets about the unknown entity in the query.

Your job: produce an enriched, keyword-rich search query that captures:
  - What the unknown entity actually does / its domain
  - What the user is trying to find (alternatives, similar tools, integrations, etc.)

Respond ONLY with the enriched query string. No prose, no JSON, no markdown. One line only.

EXAMPLES:
Original query: "alternatives to unsiloed ai"
Snippets: "Unsiloed AI is a data integration platform that uses AI to connect and unify data across enterprise silos..."
Output: alternatives to AI-powered enterprise data integration and unification platform

Original query: "something like frobnicator.js"
Snippets: "frobnicator.js is a Node.js library for real-time audio synthesis and DSP processing..."
Output: Node.js real-time audio synthesis DSP processing library alternatives
"""


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class GatekeeperDecision(BaseModel):
    action: str = Field(description="One of: web_search, vector_search, clarify")
    optimized_query: str = Field(description="Improved keyword-rich query. Empty when action=clarify.")
    clarification_question: str = Field(description="Short clarification question. Empty when action != clarify.")
    reasoning: str = Field(description="One-sentence reason for routing decision.")
    needs_enrichment: bool = Field(
        default=False,
        description="True if the core entity in the query is obscure/unknown and needs a prior web lookup.",
    )


# ---------------------------------------------------------------------------
# Cached singletons
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_gatekeeper_llm():
    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
        max_tokens=300,
    )
    return llm.with_structured_output(GatekeeperDecision)


@lru_cache(maxsize=1)
def _get_synthesis_llm():
    """Separate LLM instance for synthesizing web search results (no structured output)."""
    return ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.3,
        max_tokens=400,
    )


@lru_cache(maxsize=1)
def _get_enrichment_llm():
    """Lightweight LLM call: just outputs one enriched query string."""
    return ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
        max_tokens=80,  # one line output → keep cheap
    )


@lru_cache(maxsize=1)
def _get_embeddings_model() -> HuggingFaceEmbeddings:
    model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    return HuggingFaceEmbeddings(model_name=model_name)


# ---------------------------------------------------------------------------
# Web search (Serper.dev Search API)
# ---------------------------------------------------------------------------

async def _web_search(query: str, max_results: int = 5) -> list[dict]:
    """
    Fetch web results from Serper.dev API (Google Search).
    Returns list of {title, url, snippet} dicts.
    """
    start_time = time.time()
    # 1. Update your .env to use SERPER_API_KEY
    api_key = os.getenv("SERPER_API_KEY") or "39f6ab13268ea48e13ddb342180ba99b3e87901c"
    if not api_key:
        logger.warning("SERPER_API_KEY not set — web search unavailable.")
        return []

    url = "https://google.serper.dev/search"
    
    # Serper headers use 'X-API-KEY'
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json"
    }
    
    # Serper uses a JSON payload for POST requests
    payload = {
        "q": query,
        "num": max_results,
        "gl": "us", # Optional: Geolocation (e.g., 'in' for India)
        "hl": "en"  # Optional: Host language
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Note the switch to client.post and 'json=payload'
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            # Serper stores results in the 'organic' key
            results = data.get("organic", [])
            
            out = [
                {
                    "title": r.get("title", ""),
                    "url": r.get("link", ""),     # Serper uses 'link'
                    "snippet": r.get("snippet", ""), # Serper uses 'snippet'
                }
                for r in results
            ]
            logger.info("web_search completed in {:.2f}s", time.time() - start_time)
            return out
        except Exception:
            logger.exception("Serper API call failed for query='{}'. Took {:.2f}s", query, time.time() - start_time)
            return []

async def _synthesize_web_results(query: str, results: list[dict]) -> str:
    """Use the LLM to synthesize raw search results into a readable answer."""
    if not results:
        return "No web results found for this query."

    start_time = time.time()
    results_text = "\n\n".join(
        f"[{i+1}] {r['title']}\nURL: {r['url']}\n{r['snippet']}"
        for i, r in enumerate(results)
    )

    llm = _get_synthesis_llm()
    messages = [
        SystemMessage(content=WEB_SEARCH_SYSTEM_PROMPT),
        HumanMessage(content=f"User question: {query}\n\nSearch results:\n{results_text}"),
    ]

    try:
        response = await llm.ainvoke(messages)
        logger.info("_synthesize_web_results completed in {:.2f}s", time.time() - start_time)
        return response.content.strip()
    except Exception:
        logger.exception("Web result synthesis failed. Took {:.2f}s", time.time() - start_time)
        return "\n\n".join(
            f"**{r['title']}**\n{r['snippet']}\n{r['url']}" for r in results[:3]
        )


def _normalize_web_results_for_ui(results: list[dict]) -> list[dict]:
    normalized: list[dict] = []
    for result in results:
        normalized.append(
            {
                "repo_name": result.get("title") or "Web result",
                "description": result.get("snippet") or "",
                "url": result.get("url") or "",
                "domain": "web",
            }
        )
    return normalized


# ---------------------------------------------------------------------------
# Entity Enrichment
# ---------------------------------------------------------------------------

def _extract_core_entity(query: str) -> str:
    """
    Best-effort extraction of the core noun/tool from the query.
    e.g. "give me alternatives to unsiloed ai" → "unsiloed ai"
    Falls back to the full query if no pattern matches.
    """
    # Common patterns: "alternatives to X", "something like X", "similar to X",
    # "what is X", "how does X work", "X alternatives", "replace X"
    patterns = [
        r"(?:alternatives?\s+to|similar\s+to|something\s+like|instead\s+of|replace|replacing)\s+(.+)",
        r"what\s+is\s+(.+?)(?:\s+and|\s+how|\?|$)",
        r"how\s+does\s+(.+?)\s+work",
        r"(.+?)\s+alternatives?",
    ]
    q = query.strip().lower()
    for pat in patterns:
        m = re.search(pat, q)
        if m:
            return m.group(1).strip()
    return query.strip()


async def _enrich_query_with_web_context(
    original_query: str,
    gatekeeper_optimized: str,
) -> str:
    """
    When the gatekeeper flags needs_enrichment=True:
      1. Extract the core unknown entity from the query.
      2. Do a quick web search: "what is <entity>"
      3. Feed snippets + original query to a cheap LLM call.
      4. Return an enriched query string ready for embedding / vector search.

    Falls back to gatekeeper_optimized if anything fails.
    """
    start_time = time.time()
    entity = _extract_core_entity(original_query)
    lookup_query = f"what is {entity}"

    logger.info("Enrichment: looking up entity='{}' via web search", entity)
    snippets = await _web_search(lookup_query, max_results=3)

    if not snippets:
        logger.warning("Enrichment web search returned no results — using gatekeeper query as-is.")
        return gatekeeper_optimized

    snippets_text = " ".join(s["snippet"] for s in snippets if s["snippet"])[:800]

    llm = _get_enrichment_llm()
    messages = [
        SystemMessage(content=ENRICHMENT_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"Original query: {original_query}\n"
                f"Snippets: {snippets_text}"
            )
        ),
    ]

    try:
        response = await llm.ainvoke(messages)
        enriched = response.content.strip().splitlines()[0].strip()
        if not enriched:
            raise ValueError("Empty enrichment output")
        logger.info(
            "Enrichment complete original='{}' enriched='{}'. Took {:.2f}s",
            original_query, enriched, time.time() - start_time,
        )
        return enriched
    except Exception:
        logger.exception("Enrichment LLM call failed — falling back to gatekeeper query. Took {:.2f}s", time.time() - start_time)
        return gatekeeper_optimized


# ---------------------------------------------------------------------------
# Embedding + vector search
# ---------------------------------------------------------------------------

async def _embed_text(text: str) -> list[float]:
    start_time = time.time()
    model = _get_embeddings_model()
    if hasattr(model, "embed_query"):
        vector = await asyncio.to_thread(model.embed_query, text)
    elif hasattr(model, "encode"):
        raw = await asyncio.to_thread(model.encode, text)
        vector = raw.tolist() if hasattr(raw, "tolist") else list(raw)
    else:
        raise RuntimeError("Embeddings model has no supported method.")
    logger.info("_embed_text completed in {:.2f}s", time.time() - start_time)
    return list(vector)


# ---------------------------------------------------------------------------
# Gatekeeper
# ---------------------------------------------------------------------------

def _is_second_attempt(query: str) -> bool:
    return query.strip().lower().startswith("original intent:")


def _extract_clarification_fragment(query: str) -> str:
    if "Clarification:" in query:
        part = query.split("Clarification:")[-1].strip()
        return part if len(part) > 3 else ""
    return ""


async def _run_gatekeeper(query: str) -> GatekeeperDecision:
    start_time = time.time()
    gatekeeper = _get_gatekeeper_llm()
    messages = [
        SystemMessage(content=GATEKEEPER_SYSTEM_PROMPT),
        HumanMessage(content=query),
    ]
    try:
        decision: GatekeeperDecision = await gatekeeper.ainvoke(messages)

        # Safety: if LLM still says clarify on a second attempt, override
        if decision.action == "clarify" and _is_second_attempt(query):
            logger.warning("Gatekeeper tried to clarify on second attempt — overriding to vector_search.")
            decision.action = "vector_search"
            decision.optimized_query = (
                _extract_clarification_fragment(query) or query
            )
            decision.clarification_question = ""
            decision.needs_enrichment = False

        logger.info("_run_gatekeeper completed in {:.2f}s", time.time() - start_time)
        return decision
    except Exception:
        logger.exception("Gatekeeper LLM failed for query='{}'. Using fallback. Took {:.2f}s", query, time.time() - start_time)
        return GatekeeperDecision(
            action="vector_search",
            optimized_query=query,
            clarification_question="",
            reasoning="Fallback: LLM error.",
            needs_enrichment=False,
        )


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

async def process_search_query(request: SearchRequest) -> dict[str, Any]:
    """
    Routing pipeline:
      1. Gatekeeper classifies query → web_search | vector_search | clarify
         - Also signals needs_enrichment=True for obscure/unknown entities.

      2a. clarify  → return clarification question to frontend.

      2b. web_search → Brave Search API → LLM synthesis → return answer.

      2c. vector_search:
            i.  If needs_enrichment=True:
                  - Web-search "what is <entity>" to get context snippets.
                  - LLM rewrites query into a rich, context-aware form.
            ii. Embed the (possibly enriched) query.
            iii. MongoDB vector search → return repos.
    """
    start_total = time.time()
    query = request.query.strip()
    logger.info("process_search_query started query='{}'", query)

    # ── Step 1: Route ──────────────────────────────────────────────────────
    decision = await _run_gatekeeper(query)
    logger.info(
        "Gatekeeper routed query='{}' action='{}' optimized='{}' needs_enrichment='{}' reason='{}'",
        query, decision.action, decision.optimized_query,
        decision.needs_enrichment, decision.reasoning,
    )

    # ── Step 2a: Clarification ─────────────────────────────────────────────
    if decision.action == "clarify":
        logger.info("process_search_query finished (clarify) in {:.2f}s", time.time() - start_total)
        return {
            "status": "clarification_needed",
            "action": "clarify",
            "message": decision.clarification_question,
            "enriched_query": "",
            "results": [],
            "answer": None,
        }

    optimized_query = (
        decision.optimized_query.strip()
        or _extract_clarification_fragment(query)
        or query
    )

    # ── Step 2b: Web search ────────────────────────────────────────────────
    if decision.action == "web_search":
        logger.info("Executing web search for query='{}'", optimized_query)
        try:
            raw_results = await _web_search(optimized_query)
            answer = await _synthesize_web_results(optimized_query, raw_results)
            ui_results = _normalize_web_results_for_ui(raw_results)
            logger.info("Web search completed result_count={}", len(raw_results))
            logger.info("process_search_query finished (web_search) in {:.2f}s", time.time() - start_total)
            return {
                "status": "success",
                "action": "web_search",
                "message": f"{len(raw_results)} web result(s) found.",
                "enriched_query": optimized_query,
                "results": ui_results,
                "answer": answer,
            }
        except Exception:
            logger.exception("Web search pipeline failed for query='{}'", optimized_query)
            return {
                "status": "error",
                "action": "web_search",
                "message": "Web search failed. Please try again.",
                "enriched_query": optimized_query,
                "results": [],
                "answer": None,
            }

    # ── Step 2c: Vector search ─────────────────────────────────────────────
    logger.info("Executing vector search for query='{}'", optimized_query)
    try:
        # ── Enrichment step (only when gatekeeper flagged needs_enrichment) ──
        if decision.needs_enrichment:
            logger.info("Enrichment triggered for query='{}'", query)
            optimized_query = await _enrich_query_with_web_context(
                original_query=query,
                gatekeeper_optimized=optimized_query,
            )
            logger.info("Using enriched query='{}'", optimized_query)

        embedding = await _embed_text(optimized_query)
        logger.debug("Embedding dimension={}", len(embedding))
        
        start_vs = time.time()
        try:
            results = await asyncio.wait_for(
                asyncio.to_thread(vector_search, query_embedding=embedding),
                timeout=15.0
            )
            logger.info("Vector DB search done in {:.2f}s, result_count={}", time.time() - start_vs, len(results))
        except asyncio.TimeoutError:
            logger.error("Vector DB search timed out after 15.0s!")
            raise

        logger.info("process_search_query finished (vector_search) in {:.2f}s", time.time() - start_total)
        return {
            "status": "success",
            "action": "vector_search",
            "message": f"{len(results)} repo(s) found.",
            "results": results,
            "answer": None,
            # Surface the enriched query so the UI can show "Searched for: ..."
            "enriched_query": optimized_query if decision.needs_enrichment else None,
        }
    except Exception:
        logger.exception("Vector search pipeline failed for query='{}'", optimized_query)
        return {
            "status": "error",
            "action": "vector_search",
            "message": "Search failed. Please try again.",
            "results": [],
            "answer": None,
        }