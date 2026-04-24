type EnrichmentPillProps = {
  query: string;
};

export default function EnrichmentPill({ query }: EnrichmentPillProps) {
  return (
    <p className="enrichment-pill">
      <span aria-hidden="true">✦</span>
      <span>Searched for: {query}</span>
    </p>
  );
}
