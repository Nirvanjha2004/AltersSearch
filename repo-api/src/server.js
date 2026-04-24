const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const GITHUB_API_BASE = "https://api.github.com";
const CACHE_TTL_MS = Number(process.env.REPO_CACHE_TTL_MS || 1000 * 60 * 5);

const cache = new Map();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" }));

function getCacheKey(owner, repo) {
  return `${owner}/${repo}`.toLowerCase();
}

function getAuthHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function isRateLimitResponse(response) {
  if (response.status !== 403) return false;
  const remaining = response.headers.get("x-ratelimit-remaining");
  return remaining === "0";
}

async function fetchGitHub(endpoint, { optional = false } = {}) {
  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "AltersSearch-Repo-API",
      ...getAuthHeaders(),
    },
  });

  if (isRateLimitResponse(response)) {
    const resetAt = response.headers.get("x-ratelimit-reset");
    const resetMessage = resetAt ? ` Try again after ${new Date(Number(resetAt) * 1000).toLocaleTimeString()}.` : "";
    const error = new Error(`GitHub API rate limit exceeded.${resetMessage}`);
    error.status = 429;
    throw error;
  }

  if (!response.ok) {
    if (optional) return null;
    const error = new Error(`GitHub API request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function parseReadme(readmePayload) {
  if (!readmePayload || !readmePayload.content) return "";
  try {
    return Buffer.from(readmePayload.content, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

app.get("/api/repo/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params;
  const cacheKey = getCacheKey(owner, repo);
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return res.json(cached.payload);
  }

  try {
    const repoEndpoint = `/repos/${owner}/${repo}`;
    const languagesEndpoint = `/repos/${owner}/${repo}/languages`;
    const contributorsEndpoint = `/repos/${owner}/${repo}/contributors?per_page=10`;
    const readmeEndpoint = `/repos/${owner}/${repo}/readme`;

    const [repoResponse, languagesResponse, contributorsResponse, readmeResponse] = await Promise.all([
      fetchGitHub(repoEndpoint),
      fetchGitHub(languagesEndpoint, { optional: true }),
      fetchGitHub(contributorsEndpoint, { optional: true }),
      fetchGitHub(readmeEndpoint, { optional: true }),
    ]);

    const payload = {
      repo: repoResponse,
      languages: languagesResponse || {},
      contributors: contributorsResponse || [],
      readme: parseReadme(readmeResponse),
    };

    cache.set(cacheKey, { payload, cachedAt: Date.now() });
    return res.json(payload);
  } catch (error) {
    const status = error.status || 500;
    if (status === 404) {
      return res.status(404).json({ message: "Repository not found." });
    }
    if (status === 429) {
      return res.status(429).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to fetch repository details from GitHub." });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Repo API listening on http://localhost:${PORT}`);
});
