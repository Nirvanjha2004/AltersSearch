"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

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
      className="prose prose-invert max-w-none rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-6 prose-headings:mb-3 prose-headings:mt-8 prose-headings:text-[var(--text-primary)] prose-p:leading-7 prose-p:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent)] prose-li:text-[var(--text-secondary)]"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={{
          a: ({ href, ...props }) => {
            const isHashLink = typeof href === "string" && href.startsWith("#");
            if (isHashLink) {
              return <a href={href} {...props} />;
            }
            return <a href={href} {...props} target="_blank" rel="noreferrer" />;
          },
          img: ({ ...props }) => <img {...props} className="h-auto max-w-full rounded-lg border border-white/10" loading="lazy" />,
          table: ({ ...props }) => (
            <div className="my-6 w-full overflow-x-auto">
              <table {...props} className="w-full min-w-[640px] border-collapse text-left text-sm" />
            </div>
          ),
          h1: ({ ...props }) => <h1 {...props} className="scroll-mt-24" />,
          h2: ({ ...props }) => <h2 {...props} className="scroll-mt-24" />,
          h3: ({ ...props }) => <h3 {...props} className="scroll-mt-24" />,
          h4: ({ ...props }) => <h4 {...props} className="scroll-mt-24" />,
          h5: ({ ...props }) => <h5 {...props} className="scroll-mt-24" />,
          h6: ({ ...props }) => <h6 {...props} className="scroll-mt-24" />,
          thead: ({ ...props }) => <thead {...props} className="border-b border-white/10 bg-[var(--bg-elevated)]" />,
          th: ({ ...props }) => <th {...props} className="px-3 py-2 font-semibold text-[var(--text-primary)]" />,
          td: ({ ...props }) => <td {...props} className="border-b border-white/10 px-3 py-2 text-[var(--text-secondary)]" />,
          pre: ({ ...props }) => (
            <pre {...props} className="my-5 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-6" />
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className?.includes("language-"));
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[13px] text-[var(--text-primary)]" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </motion.article>
  );
}
