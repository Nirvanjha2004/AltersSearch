// Maps each chip label to a thoughtfully crafted natural language query

export interface Chip {
  id: string;
  label: string;
  emoji?: string;
  query: string;
}

export interface ChipGroup {
  id: string;
  heading: string;
  chips: Chip[];
}

export const CHIP_GROUPS: ChipGroup[] = [
  {
    id: "use-case",
    heading: "Popular searches",
    chips: [
      {
        id: "startup",
        emoji: "🚀",
        label: "Build a startup",
        query: "production-ready SaaS boilerplate with auth payments and dashboard",
      },
      {
        id: "learn-ai",
        emoji: "🧠",
        label: "Learn AI",
        query: "beginner friendly machine learning projects with tutorials and notebooks",
      },
      {
        id: "portfolio",
        emoji: "📈",
        label: "Build portfolio",
        query: "impressive portfolio project ideas for developers with source code",
      },
      {
        id: "contribute",
        emoji: "🤝",
        label: "Contribute to OSS",
        query: "good first issue open source projects actively maintained beginner friendly",
      },
      {
        id: "side-project",
        emoji: "💡",
        label: "Side project ideas",
        query: "interesting side project starter templates for indie developers",
      },
    ],
  },
  {
    id: "smart-queries",
    heading: "Smart queries",
    chips: [
      {
        id: "nextjs-saas",
        label: "Next.js SaaS starter",
        query: "Next.js SaaS starter template with authentication Stripe and Tailwind",
      },
      {
        id: "python-beginner",
        label: "Python for beginners",
        query: "beginner friendly Python projects with clear documentation and examples",
      },
      {
        id: "fastapi-backend",
        label: "FastAPI backend",
        query: "FastAPI production backend template with auth database and Docker",
      },
      {
        id: "react-dashboard",
        label: "React dashboard UI",
        query: "open source React admin dashboard with charts and data tables",
      },
      {
        id: "devops-tools",
        label: "Trending DevOps",
        query: "trending DevOps tools for CI/CD infrastructure automation and monitoring",
      },
      {
        id: "llm-apps",
        label: "LLM app templates",
        query: "LLM powered application starter with RAG vector search and chat UI",
      },
    ],
  },
  {
    id: "tech-filters",
    heading: "By technology",
    chips: [
      {
        id: "tech-nextjs",
        label: "Next.js",
        query: "best Next.js open source projects with App Router and TypeScript",
      },
      {
        id: "tech-python",
        label: "Python",
        query: "popular Python libraries and frameworks for web development and data science",
      },
      {
        id: "tech-ai",
        label: "AI / ML",
        query: "state of the art AI machine learning repositories with pretrained models",
      },
      {
        id: "tech-backend",
        label: "Backend",
        query: "scalable backend frameworks and API boilerplates for production use",
      },
      {
        id: "tech-devops",
        label: "DevOps",
        query: "DevOps automation tools for Kubernetes Docker and cloud infrastructure",
      },
      {
        id: "tech-ui",
        label: "UI / Frontend",
        query: "beautiful open source UI component libraries and design systems",
      },
    ],
  },
];
