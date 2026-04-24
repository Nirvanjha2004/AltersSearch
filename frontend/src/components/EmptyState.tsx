type EmptyStateProps = {
  onSuggestionClick: (value: string) => void;
};

const SUGGESTIONS = [
  "python csv parser",
  "alternatives to Redis",
  "react drag and drop",
];

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <h1 className="empty-title">AltersSearch</h1>
      <p className="empty-tagline">Find the right repo. Instantly.</p>

      <div className="suggestion-row" role="list" aria-label="Suggested queries">
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} className="suggestion-chip" type="button" onClick={() => onSuggestionClick(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
