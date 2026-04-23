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
  results?: SearchResult[];
  clarification_question?: string;
}