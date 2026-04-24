"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

type ReadmeViewerProps = {
  markdown: string;
};

export default function ReadmeViewer({ markdown }: ReadmeViewerProps) {
  if (!markdown) {
    return <div className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]">No README available.</div>;
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="prose prose-invert max-w-none rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-6 prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent)]"
    >
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </motion.article>
  );
}
