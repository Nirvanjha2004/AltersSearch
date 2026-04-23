import asyncio
import os
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from pydantic import BaseModel, Field

from app.database import vector_search
from app.logger import logger
from app.schemas import SearchRequest


class QueryAssessment(BaseModel):
    is_clear: bool = Field(description="Whether the user query is clear enough for software engineering search.")
    clarification_question: str = Field(
        description="One concise clarification question when query is unclear. Empty string when query is clear."
    )
    optimized_query: str = Field(
        description="A concise, improved software engineering search query preserving user intent."
    )


def _build_llm():
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
    )
    return llm.with_structured_output(QueryAssessment)


def _build_embeddings_model():
    """Build a local HuggingFace embeddings model for vector search."""
    model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    return HuggingFaceEmbeddings(model_name=model_name)


async def _embed_query_text(text: str) -> list[float]:
    model = _build_embeddings_model()

    if hasattr(model, "aembed_query"):
        vector = await model.aembed_query(text)
        return list(vector)

    if hasattr(model, "embed_query"):
        vector = model.embed_query(text)
        return list(vector)

    if hasattr(model, "encode"):
        vector = model.encode(text)
        return vector.tolist() if hasattr(vector, "tolist") else list(vector)

    raise RuntimeError("No supported embedding method was found on the embeddings model.")


async def process_search_query(request: SearchRequest) -> dict[str, Any]:
    logger.info("Starting gatekeeper evaluation query='{}'", request.query)
    gatekeeper = _build_llm()

    messages = [
        SystemMessage(
    content=(
        "You are the Intelligence Orchestrator for AltersSearch, a specialized GitHub repository search engine. "
        "Your primary objective is to evaluate the 'Information Density' of user queries.\n\n"
        
        "DETERMINATION RULES:\n"
        "1. HIGH DENSITY (is_clear=true): The query contains functional requirements, architectural goals, "
        "or specific technical contexts (even if niche or unknown to you). If you can identify WHAT the software "
        "should do, proceed to search.\n"
        
        "2. LOW DENSITY (is_clear=false): The query is a single term with no context, a greeting, or "
        "completely lacks actionable intent (e.g., just 'Help', 'Search', or a brand name with no verb).\n\n"
        
        "3. OPTIMIZATION: When is_clear=true, your 'optimized_query' must strip out conversational filler "
        "and expand niche terms into broad semantic descriptors to maximize vector database hit rates.\n\n"
        
        "Example: If a user mentions an unknown tool like 'Unsiloed AI' but describes it as 'parsing PDFs to JSON', "
        "your optimized_query should be 'PDF parser OCR JSON structured data extraction'."
    )
    ),
        HumanMessage(content=request.query),
    ]

    try:
        assessment = await gatekeeper.ainvoke(messages)
        logger.info(
            "Gatekeeper decision query='{}' is_clear={} optimized_query='{}'",
            request.query,
            assessment.is_clear,
            assessment.optimized_query,
        )
    except Exception:
        logger.exception("Gatekeeper LLM evaluation failed query='{}'", request.query)
        assessment = QueryAssessment(
            is_clear=True,
            clarification_question="",
            optimized_query=request.query,
        )
        logger.warning("Falling back to raw search query='{}'", request.query)

    if not assessment.is_clear:
        logger.warning("Query requires clarification query='{}'", request.query)
        return {
            "status": "clarification_needed",
            "message": assessment.clarification_question,
            "results": [],
        }

    optimized_query = assessment.optimized_query.strip() or request.query
    logger.info("Embedding optimized query='{}'", optimized_query)

    try:
        query_embedding = await _embed_query_text(optimized_query)
        logger.debug("Embedding created for query='{}' dimension={}", optimized_query, len(query_embedding))
        search_results = await asyncio.to_thread(
            vector_search,
            query_embedding=query_embedding,
        )
        logger.info("Vector search completed optimized_query='{}' result_count={}", optimized_query, len(search_results))
    except Exception:
        logger.exception("Vector search pipeline failed optimized_query='{}'", optimized_query)
        return {
            "status": "error",
            "message": "Database search failed.",
            "results": [],
        }

    return {
        "status": "success",
        "message": "Results found.",
        "results": search_results,
    }
