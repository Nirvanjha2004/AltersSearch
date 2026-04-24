export interface SearchRequest {
  query: string;
  context?: string; 
}

export interface SearchResult {
  repo_name: string;
  description: string;
  url: string;
  domain: string;
}

export interface AgentResponse {
  message: string;
  status: 'success' | 'clarification_needed' | 'error';
  action?: 'web_search' | 'vector_search' | 'clarify';
  answer?: string | null;
  enriched_query?: string;
  results?: SearchResult[];
  clarification_question?: string;
}