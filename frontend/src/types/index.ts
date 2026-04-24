export interface SearchRequest {
  query: string;
  context?: string; 
}

export interface SearchResult {
  repo_name: string;
  full_name?: string;
  description: string;
  url: string;
  domain: string;
  owner_avatar_url?: string;
  owner_login?: string;
  visibility?: string;
  topics?: string[];
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  license_name?: string;
  github_pushed_at?: string;
  github_created_at?: string;
  is_archived?: boolean;
  is_fork?: boolean;
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

export interface RepoDetails {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
  watchers_count: number;
  topics: string[];
  default_branch: string;
  updated_at: string;
  pushed_at: string;
  license: { key: string; name: string } | null;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface RepoContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface RepoDetailsResponse {
  repo: RepoDetails;
  languages: Record<string, number>;
  contributors: RepoContributor[];
  readme: string;
}