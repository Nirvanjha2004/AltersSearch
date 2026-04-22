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
  status: 'success' | 'needs_clarification';
  results?: SearchResult[];
  clarification_question?: string;
}