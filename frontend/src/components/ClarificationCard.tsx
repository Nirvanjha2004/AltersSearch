type ClarificationCardProps = {
  question: string;
};

export default function ClarificationCard({ question }: ClarificationCardProps) {
  return (
    <article className="clarification-card">
      <div className="clarification-icon" aria-hidden="true">?</div>
      <h2 className="clarification-title">Could you be more specific?</h2>
      <p className="clarification-text">{question}</p>
    </article>
  );
}
