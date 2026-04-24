import type { SearchResult } from "../types";

type ResultCardProps = {
	result: SearchResult;
	index: number;
};

export default function ResultCard({ result, index }: ResultCardProps) {
	return (
		<article className="repo-card" style={{ animationDelay: `${index * 60}ms` }}>
			<div className="repo-top-row">
				<h3 className="repo-name">{result.repo_name}</h3>
				<span className="repo-domain">{result.domain}</span>
			</div>
			<p className="repo-description">{result.description}</p>
			<a href={result.url} target="_blank" rel="noreferrer" className="repo-link">
				{result.url}
			</a>
		</article>
	);
}
