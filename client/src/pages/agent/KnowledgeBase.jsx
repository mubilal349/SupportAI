import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Clock3,
  FileText,
  Filter,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Tag,
  X,
} from "lucide-react";

/* =========================================================
   API
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const KNOWLEDGE_BASE_URL = `${API_BASE_URL}/knowledge-base`;

const getToken = () => {
  return (
    localStorage.getItem("supportai_token") ||
    localStorage.getItem("token") ||
    ""
  );
};

const apiRequest = async (url) => {
  const token = getToken();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Unable to load Knowledge Base.");
  }

  return data;
};

/* =========================================================
   RESPONSE HELPERS
========================================================= */

const getArticlesFromResponse = (response) => {
  if (Array.isArray(response?.articles)) {
    return response.articles;
  }

  if (Array.isArray(response?.data?.articles)) {
    return response.data.articles;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (date) => {
  if (!date) {
    return "Recently";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Recently";
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getReadTime = (article) => {
  const text = `${article?.content || ""} ${article?.solution || ""}`;

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const getDescription = (article) => {
  const content = String(article?.content || "")
    .replace(/^#+\s?/gm, "")
    .replace(/\*+/g, "")
    .replace(/\r?\n/g, " ")
    .trim();

  if (!content) {
    return "No description available.";
  }

  if (content.length <= 150) {
    return content;
  }

  return `${content.substring(0, 150)}...`;
};

const getCategoryStyle = (category) => {
  const value = String(category || "").toLowerCase();

  if (value.includes("account") || value.includes("security")) {
    return "border-violet-500/20 bg-violet-500/10 text-violet-400";
  }

  if (value.includes("payment") || value.includes("billing")) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (value.includes("technical") || value.includes("troubleshooting")) {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-400";
  }

  if (value.includes("ticket") || value.includes("support")) {
    return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  }

  if (value.includes("agent")) {
    return "border-orange-500/20 bg-orange-500/10 text-orange-400";
  }

  if (value.includes("ai")) {
    return "border-pink-500/20 bg-pink-500/10 text-pink-400";
  }

  return "border-blue-500/20 bg-blue-500/10 text-blue-400";
};

/* =========================================================
   COMPONENT
========================================================= */

const KnowledgeBase = () => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  /* =======================================================
     LOAD ARTICLES
  ======================================================= */

  const loadArticles = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await apiRequest(KNOWLEDGE_BASE_URL);

      setArticles(getArticlesFromResponse(response));
    } catch (err) {
      console.error("Agent Knowledge Base Error:", err);

      setError(err?.message || "Unable to load Knowledge Base.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    const values = articles
      .map((article) => article?.category)
      .filter(Boolean)
      .map((value) => String(value).trim());

    return [...new Set(values)].sort();
  }, [articles]);

  /* =======================================================
     FILTERED ARTICLES
  ======================================================= */

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((article) => {
      const title = String(article?.title || "");

      const articleCategory = String(article?.category || "");

      const content = String(article?.content || "");

      const solution = String(article?.solution || "");

      const tags = Array.isArray(article?.tags) ? article.tags.join(" ") : "";

      const searchableText =
        `${title} ${articleCategory} ${content} ${solution} ${tags}`.toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesCategory =
        category === "all" ||
        articleCategory.toLowerCase() === category.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [articles, search, category]);

  /* =======================================================
     OPEN ARTICLE DETAILS PAGE
  ======================================================= */

  const openArticle = (article) => {
    const id = article?._id || article?.id;

    if (!id) {
      console.error("Knowledge Base article has no valid ID:", article);
      return;
    }

    navigate(`/agent/knowledge-base/${id}`);
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
  };

  const hasFilters = Boolean(search.trim()) || category !== "all";

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-110px)] items-center justify-center px-6">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-[#0a1425] shadow-xl">
            <Loader2 className="animate-spin text-blue-500" size={26} />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-400">
            Loading Knowledge Base...
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Preparing support resources
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0a1425]">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/[0.06] blur-3xl" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                <BookOpen size={15} />
                Agent Workspace
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Knowledge Base
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Find verified solutions, troubleshooting guides, and support
                resources while helping customers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadArticles(true)}
              disabled={refreshing}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 text-sm font-semibold text-slate-400 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={refreshing ? "animate-spin" : ""}
                size={16}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-5 py-4">
          <AlertCircle className="mt-0.5 shrink-0 text-red-400" size={18} />

          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">
              Unable to load Knowledge Base
            </p>

            <p className="mt-1 text-xs text-red-400/70">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => loadArticles()}
            className="text-xs font-medium text-red-300 transition hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0a1425] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Articles
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <FileText size={17} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold text-white">
            {articles.length}
          </p>

          <p className="mt-1 text-xs text-slate-600">Published resources</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1425] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Categories
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Tag size={17} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold text-violet-400">
            {categories.length}
          </p>

          <p className="mt-1 text-xs text-slate-600">Support topics</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1425] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Results
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Search size={17} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold text-cyan-400">
            {filteredArticles.length}
          </p>

          <p className="mt-1 text-xs text-slate-600">Matching articles</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0a1425] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Video Guides
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Play size={17} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold text-emerald-400">
            {
              articles.filter((article) => Boolean(article?.solutionVideoUrl))
                .length
            }
          </p>

          <p className="mt-1 text-xs text-slate-600">Visual solutions</p>
        </div>
      </div>

      {/* ===================================================
          SEARCH / FILTER
      =================================================== */}

      <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0a1425] p-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles, solutions, categories, or tags..."
              className="h-12 w-full rounded-xl border border-slate-800 bg-slate-950/40 pl-11 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/40 focus:bg-slate-950/70"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((previous) => !previous)}
              className={[
                "flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition",
                showFilters || category !== "all"
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                  : "border-slate-800 bg-slate-950/40 text-slate-500 hover:text-slate-200",
              ].join(" ")}
            >
              <Filter size={16} />
              Filters
              {category !== "all" && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500/20 px-1.5 text-[10px] text-blue-400">
                  1
                </span>
              )}
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-4 text-sm font-medium text-slate-500 transition hover:text-white"
              >
                <X size={15} />
                Clear
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 border-t border-slate-800 pt-4">
            <div className="max-w-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Category
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-300 outline-none transition focus:border-blue-500/40"
              >
                <option value="all">All Categories</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* ===================================================
          RESULTS HEADER
      =================================================== */}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              Support Resources
            </h2>

            <span className="rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              {filteredArticles.length}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-600">
            Browse verified resources available to agents.
          </p>
        </div>

        {hasFilters && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
            <Filter size={12} />
            Filters active
          </span>
        )}
      </div>

      {/* ===================================================
          ARTICLE GRID
      =================================================== */}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => {
            const id = article?._id || article?.id;

            return (
              <button
                key={id || article?.title}
                type="button"
                onClick={() => openArticle(article)}
                className="group flex h-full w-full flex-col rounded-2xl border border-slate-800 bg-[#0a1425] p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-blue-500/25 hover:bg-[#0c172a] hover:shadow-xl hover:shadow-black/10 sm:p-6"
              >
                {/* TOP */}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <BookOpen size={20} />
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition group-hover:bg-blue-500/10 group-hover:text-blue-400">
                    <ArrowUpRight size={17} />
                  </div>
                </div>

                {/* META */}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getCategoryStyle(
                      article?.category,
                    )}`}
                  >
                    {article?.category || "General"}
                  </span>

                  {article?.solutionVideoUrl && (
                    <span className="flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-400">
                      <Play size={10} />
                      Video
                    </span>
                  )}
                </div>

                {/* CONTENT */}

                <div className="mt-4 flex-1">
                  <h3 className="line-clamp-2 text-lg font-semibold leading-7 text-slate-100 transition group-hover:text-white">
                    {article?.title || "Knowledge Base Article"}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {getDescription(article)}
                  </p>
                </div>

                {/* TAGS */}

                {Array.isArray(article?.tags) && article.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-[10px] text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}

                    {article.tags.length > 3 && (
                      <span className="rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-[10px] text-slate-600">
                        +{article.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* FOOTER */}

                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <Clock3 size={13} />

                    {getReadTime(article)}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400">
                    Read Article
                    <span>
                      <ArrowUpRight
                        size={13}
                        className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-[#0a1425] px-6 py-20 text-center md:col-span-2 xl:col-span-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Search size={27} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-300">
              {articles.length === 0
                ? "No Knowledge Base articles"
                : "No articles found"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              {articles.length === 0
                ? "Published Knowledge Base articles will appear here."
                : "Try another search term or remove the current category filter."}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <X size={15} />
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
