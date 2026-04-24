"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import RepoHeader from "../../../../components/repo-detail/RepoHeader";
import RepoSidebar from "../../../../components/repo-detail/RepoSidebar";
import RepoStatsBar from "../../../../components/repo-detail/RepoStatsBar";
import RepoTabs, { type RepoTabId } from "../../../../components/repo-detail/RepoTabs";
import type { RepoDetailsResponse } from "../../../../types";

const ReadmeViewer = dynamic(() => import("../../../../components/repo-detail/ReadmeViewer"));
const ContributorsList = dynamic(() => import("../../../../components/repo-detail/ContributorsList"));
const LanguageChart = dynamic(() => import("../../../../components/repo-detail/LanguageChart"));

type RepoPageProps = {
  params: { owner: string; repo: string };
};

function DetailsSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-[var(--bg-surface)]" />
      ))}
    </div>
  );
}

export default function RepoDetailsPage({ params }: RepoPageProps) {
  const [data, setData] = useState<RepoDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RepoTabId>("overview");
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const candidates = [
          process.env.NEXT_PUBLIC_REPO_API_URL,
          "http://localhost:8000",
          "http://localhost:4000",
        ].filter(Boolean) as string[];

        let lastError: Error | null = null;
        let payload: (RepoDetailsResponse & { message?: string; detail?: string }) | null = null;

        for (const base of candidates) {
          try {
            const response = await fetch(`${base}/api/repo/${params.owner}/${params.repo}`);
            const json = (await response.json()) as RepoDetailsResponse & { message?: string; detail?: string };
            if (!response.ok) {
              throw new Error(json.message || json.detail || "Failed to fetch repository details.");
            }
            payload = json;
            break;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error("Failed to fetch repository details.");
          }
        }

        if (!payload) {
          throw lastError || new Error("Could not connect to backend API. Start backend on port 8000.");
        }
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [params.owner, params.repo]);

  const tabContent = useMemo(() => {
    if (!data) return null;
    if (activeTab === "readme") return <ReadmeViewer markdown={data.readme} />;
    if (activeTab === "contributors") return <ContributorsList contributors={data.contributors} />;
    if (activeTab === "languages") return <LanguageChart languages={data.languages} />;

    return (
      <section className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-6">
        <h3 className="m-0 text-lg font-semibold text-[var(--text-primary)]">Overview</h3>
        <p className="mb-0 mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {data.repo.description || "No repository description available."}
        </p>
      </section>
    );
  }, [activeTab, data]);

  const onTabChange = (tab: RepoTabId) => {
    setActiveTab(tab);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="app-shell min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]">
          <ArrowLeft size={14} />
          Back to results
        </Link>

        {loading ? <DetailsSkeleton /> : null}
        {error ? <div className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-secondary)]">{error}</div> : null}

        {!loading && !error && data ? (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, ease: "easeOut" }} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <main className="space-y-4">
              <RepoHeader repo={data.repo} />
              <RepoStatsBar repo={data.repo} />
              <RepoTabs activeTab={activeTab} onTabChange={onTabChange} />

              <div ref={contentRef}>
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                    {tabContent}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

            <RepoSidebar repo={data.repo} languages={data.languages} />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
