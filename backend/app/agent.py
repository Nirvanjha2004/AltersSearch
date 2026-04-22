import os
import importlib
from typing import Literal, Optional

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

from app.schemas import AgentResponse, SearchRequest


class QueryAssessment(BaseModel):
	"""Structured output returned by the LLM classifier."""

	status: Literal["success", "needs_clarification"]
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


async def process_search_query(request: SearchRequest) -> AgentResponse:
	"""Analyze the query and return either clarification-needed or mock success results."""
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

	return AgentResponse(
		status="success",
		results=[],
		clarification_question=None,
	)
