import os
import importlib
from typing import Literal, Optional

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from langchain_huggingface import HuggingFaceEmbeddings
from app.database import vector_search
from app.logger import logger
from app.schemas import AgentResponse, SearchRequest
from dotenv import load_dotenv
import os

# Ye line .env file se variables read karke os.environ mein daal degi
load_dotenv() 

# Ab aapka _get_supabase_client() function inhein dhoond payega
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
class QueryAssessment(BaseModel):
	"""Structured output returned by the LLM classifier."""

	status: Literal["success", "needs_clarification"]
	domain: Optional[str] = Field(
		default="all",
		description="Domain filter if explicitly known (e.g., ai, frontend, backend, devops). Use 'all' if unspecified.",
	)
	clarification_question: Optional[str] = Field(
		default=None,
		description="Required only when status is 'needs_clarification'.",
	)


_ASSESSMENT_PARSER = PydanticOutputParser(pydantic_object=QueryAssessment)

_ASSESSMENT_PROMPT = PromptTemplate(
	template=(
		"You are an expert search query analyst.\n"
		"Your job: decide if the user query is specific enough to run a code/repository search.\n\n"
		"Return status='needs_clarification' when the query is highly ambiguous, vague, or missing key constraints\n"
		"(e.g., 'make it fast', 'improve this', 'fix it'). In that case, ask exactly one short, actionable\n"
		"clarifying question.\n\n"
		"Return status='success' when the query is concrete enough to execute directly.\n"
			"Also extract an optional domain filter ONLY if the user clearly names one (examples: frontend, backend, ai, devops, data, mobile).\n"
			"If domain is not explicit, use domain='all'.\n"
		"When status='success', set clarification_question to null.\n\n"
		"User query: {query}\n"
		"Optional prior context: {context}\n\n"
		"{format_instructions}"
	),
	input_variables=["query", "context"],
	partial_variables={
		"format_instructions": _ASSESSMENT_PARSER.get_format_instructions()
	},
)


def _build_llm():
	"""Create a fast Groq-backed chat model for classification."""
	chat_groq_class = getattr(importlib.import_module("langchain_groq"), "ChatGroq")
	return chat_groq_class(
		model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
		api_key=os.getenv("GROQ_API_KEY"),
		temperature=0,
	)


def _build_embeddings_model():
	"""Build an embeddings model for vector search queries."""
	google_api_key = os.getenv("GOOGLE_API_KEY")
	if google_api_key:
		google_embeddings_class = getattr(
			importlib.import_module("langchain_google_genai"),
			"GoogleGenerativeAIEmbeddings",
		)
		return google_embeddings_class(
			model=os.getenv("EMBEDDING_MODEL", "gemini-embedding-2-preview"),
			google_api_key=google_api_key,
			output_dimensionality=int(os.getenv("EMBEDDING_DIMENSION", "1536")),
		)

	# Fallback to a local model when GOOGLE_API_KEY is not available.
	sentence_transformer_class = getattr(importlib.import_module("sentence_transformers"), "SentenceTransformer")
	return sentence_transformer_class(os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"))


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


async def process_search_query(request: SearchRequest) -> AgentResponse:
	"""Analyze the query and return either clarification-needed or vector search results."""
	llm = _build_llm()
	chain = _ASSESSMENT_PROMPT | llm | _ASSESSMENT_PARSER

	try:
		assessment = await chain.ainvoke(
			{
				"query": request.query,
				"context": request.context or "None",
			}
		)
	except Exception:
		logger.exception("Query assessment failed for query='{}'", request.query)
		# Conservative fallback: if model/parsing fails, ask for clarification.
		return AgentResponse(
			status="needs_clarification",
			clarification_question=(
				"Could you share the exact goal, target technology, and constraints for your search?"
			),
		)

	if assessment.status == "needs_clarification":
		question = assessment.clarification_question or (
			"Can you clarify your exact goal and what outcome you want from the search?"
		)
		return AgentResponse(
			status="needs_clarification",
			clarification_question=question,
		)

	search_text = request.query
	if request.context:
		search_text = f"{request.query}\nAdditional context: {request.context}"

	results = []
	try:
		query_embedding = await _embed_query_text(search_text)
		results = vector_search(query_embedding=query_embedding, domain=assessment.domain)
	except Exception:
		logger.exception(
			"Vector search failed for query='{}' domain='{}'",
			request.query,
			assessment.domain,
		)
		# Keep the API contract stable even if embeddings or DB lookup fails.
		results = []

	return AgentResponse(
		status="success",
		results=results,
		clarification_question=None,
	)
