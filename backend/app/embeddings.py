"""
Jina AI embedding helper.

Uses jina-embeddings-v3 (1024d) via direct HTTP — no extra package needed.
Free tier: 1M tokens, no credit card required.
Get your key at https://jina.ai

Set JINA_API_KEY in your .env file.
"""

import asyncio
import os
import time

import httpx
from app.logger import logger

JINA_API_URL = "https://api.jina.ai/v1/embeddings"
JINA_MODEL = "jina-embeddings-v3"
EMBEDDING_DIM = 1024

# Max texts per request (Jina supports up to 2048 but 100 is safe and fast)
JINA_BATCH_SIZE = 100


def _jina_headers() -> dict:
    api_key = os.getenv("JINA_API_KEY", "")
    if not api_key:
        raise RuntimeError("JINA_API_KEY is not set.")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of texts using Jina AI API.
    Automatically batches if len(texts) > JINA_BATCH_SIZE.
    Returns list of 1024d float vectors in the same order as input.
    """
    if not texts:
        return []

    all_vectors: list[list[float]] = []

    for i in range(0, len(texts), JINA_BATCH_SIZE):
        batch = texts[i : i + JINA_BATCH_SIZE]
        start = time.time()

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                JINA_API_URL,
                headers=_jina_headers(),
                json={
                    "model": JINA_MODEL,
                    "input": batch,
                    "task": "retrieval.passage",  # optimised for document storage
                },
            )

        if resp.status_code != 200:
            raise RuntimeError(
                f"Jina API error {resp.status_code}: {resp.text[:300]}"
            )

        data = resp.json()
        # Jina returns data sorted by index
        vectors = [item["embedding"] for item in sorted(data["data"], key=lambda x: x["index"])]
        all_vectors.extend(vectors)

        logger.info(
            "Jina embed batch {}/{} size={} in {:.2f}s",
            i // JINA_BATCH_SIZE + 1,
            (len(texts) + JINA_BATCH_SIZE - 1) // JINA_BATCH_SIZE,
            len(batch),
            time.time() - start,
        )

    return all_vectors


async def embed_query(text: str) -> list[float]:
    """
    Embed a single query string.
    Uses task=retrieval.query (different LoRA from passage for better retrieval).
    """
    start = time.time()
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            JINA_API_URL,
            headers=_jina_headers(),
            json={
                "model": JINA_MODEL,
                "input": [text],
                "task": "retrieval.query",
            },
        )

    if resp.status_code != 200:
        raise RuntimeError(
            f"Jina API error {resp.status_code}: {resp.text[:300]}"
        )

    data = resp.json()
    vector = data["data"][0]["embedding"]
    logger.info("Jina embed_query completed in {:.2f}s", time.time() - start)
    return vector
