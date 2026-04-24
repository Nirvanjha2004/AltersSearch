type AnswerCardProps = {
  answer: string;
  source?: string;
};

function getDomain(input?: string): string {
  if (!input) {
    return "source";
  }

  try {
    return new URL(input).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

export default function AnswerCard({ answer, source }: AnswerCardProps) {
  const domain = getDomain(source);
  return (
    <article className="answer-card">
      <p className="answer-label">Answer</p>
      <p className="answer-body">{answer}</p>
      {source ? (
        <a className="source-chip" href={source} target="_blank" rel="noreferrer">
          <span className="source-dot" />
          {domain}
        </a>
      ) : null}
    </article>
  );
}
