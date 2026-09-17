import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Tag,
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
    throw new Error(data?.message || "Unable to load Knowledge Base article.");
  }

  return data;
};

/* =========================================================
   RESPONSE HELPERS
========================================================= */

const getArticleFromResponse = (response) => {
  if (response?.article) {
    return response.article;
  }

  if (response?.data?.article) {
    return response.data.article;
  }

  return null;
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

const getYouTubeId = (url) => {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "").split("/")[0] || null;
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");

      if (videoId) {
        return videoId;
      }

      const parts = parsedUrl.pathname.split("/").filter(Boolean);

      const embedIndex = parts.indexOf("embed");

      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }

      const shortsIndex = parts.indexOf("shorts");

      if (shortsIndex !== -1 && parts[shortsIndex + 1]) {
        return parts[shortsIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
};

/* =========================================================
   INLINE MARKDOWN
========================================================= */

const renderInlineText = (text) => {
  const value = String(text || "");

  const parts = value.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-slate-200">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-xs text-blue-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

/* =========================================================
   CONTENT RENDERER
========================================================= */

const renderContent = (content) => {
  if (!content) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <p className="text-sm leading-7 text-slate-500">
          No content available.
        </p>
      </div>
    );
  }

  const lines = String(content).replace(/\r/g, "").split("\n");

  const elements = [];

  let unorderedItems = [];
  let orderedItems = [];

  const flushLists = () => {
    if (unorderedItems.length > 0) {
      elements.push(
        <ul
          key={`unordered-${elements.length}`}
          className="my-5 space-y-3 pl-6 text-sm leading-7 text-slate-400"
        >
          {unorderedItems.map((item, index) => (
            <li key={index} className="list-disc pl-2">
              {renderInlineText(item)}
            </li>
          ))}
        </ul>,
      );

      unorderedItems = [];
    }

    if (orderedItems.length > 0) {
      elements.push(
        <ol
          key={`ordered-${elements.length}`}
          className="my-5 space-y-3 pl-6 text-sm leading-7 text-slate-400"
        >
          {orderedItems.map((item, index) => (
            <li key={index} className="list-decimal pl-2">
              {renderInlineText(item)}
            </li>
          ))}
        </ol>,
      );

      orderedItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushLists();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);

    if (headingMatch) {
      flushLists();

      const level = headingMatch[1].length;
      const text = headingMatch[2];

      if (level === 1) {
        elements.push(
          <h2
            key={`heading-${index}`}
            className="mb-5 mt-8 text-2xl font-bold tracking-tight text-white first:mt-0"
          >
            {renderInlineText(text)}
          </h2>,
        );
      } else if (level === 2) {
        elements.push(
          <h3
            key={`heading-${index}`}
            className="mb-3 mt-8 text-xl font-semibold tracking-tight text-white"
          >
            {renderInlineText(text)}
          </h3>,
        );
      } else {
        elements.push(
          <h4
            key={`heading-${index}`}
            className="mb-3 mt-6 text-base font-semibold text-slate-200"
          >
            {renderInlineText(text)}
          </h4>,
        );
      }

      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);

    if (unorderedMatch) {
      if (orderedItems.length > 0) {
        flushLists();
      }

      unorderedItems.push(unorderedMatch[1]);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);

    if (orderedMatch) {
      if (unorderedItems.length > 0) {
        flushLists();
      }

      orderedItems.push(orderedMatch[1]);
      return;
    }

    flushLists();

    elements.push(
      <p
        key={`paragraph-${index}`}
        className="mb-4 text-sm leading-7 text-slate-400 last:mb-0"
      >
        {renderInlineText(trimmed)}
      </p>,
    );
  });

  flushLists();

  return elements;
};

/* =========================================================
   COMPONENT
========================================================= */

const KnowledgeBaseDetails = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();

  const [article, setArticle] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD ARTICLE
  ======================================================= */

  const loadArticle = async (refresh = false) => {
    if (!articleId) {
      setError("Article ID is missing.");
      setLoading(false);
      return;
    }

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await apiRequest(`${KNOWLEDGE_BASE_URL}/${articleId}`);

      const articleData = getArticleFromResponse(response);

      if (!articleData) {
        throw new Error("Knowledge Base article was not found.");
      }

      setArticle(articleData);
    } catch (err) {
      console.error("Knowledge Base Details Error:", err);

      setError(err?.message || "Unable to load Knowledge Base article.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadArticle();
  }, [articleId]);

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
            Loading Article...
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Preparing Knowledge Base resource
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !article) {
    return (
      <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        <button
          type="button"
          onClick={() => navigate("/agent/knowledge-base")}
          className="group inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0a1425] px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:border-blue-500/30 hover:text-white"
        >
          <ArrowLeft
            size={17}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Back to Knowledge Base
        </button>

        <div className="mt-6 rounded-3xl border border-red-500/20 bg-[#0a1425] px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <AlertCircle size={27} />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-white">
            Unable to Load Article
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {error ||
              "The requested Knowledge Base article could not be found."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => loadArticle()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <RefreshCw size={15} />
              Try Again
            </button>

            <button
              type="button"
              onClick={() => navigate("/agent/knowledge-base")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={15} />
              Knowledge Base
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ARTICLE DATA
  ======================================================= */

  const videoUrl = article?.solutionVideoUrl || "";
  const youtubeId = getYouTubeId(videoUrl);

  /* =======================================================
     DETAIL PAGE
  ======================================================= */

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      {/* ===================================================
          TOP NAVIGATION
      =================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/agent/knowledge-base")}
          className="group inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0a1425] px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:border-blue-500/30 hover:text-white"
        >
          <ArrowLeft
            size={17}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Back to Knowledge Base
        </button>

        <button
          type="button"
          onClick={() => loadArticle(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0a1425] px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ===================================================
          BREADCRUMB
      =================================================== */}

      <div className="mt-4 hidden items-center gap-2 text-xs text-slate-600 sm:flex">
        <BookOpen size={14} />

        <span>Agent Workspace</span>

        <ChevronRight size={13} />

        <button
          type="button"
          onClick={() => navigate("/agent/knowledge-base")}
          className="transition hover:text-blue-400"
        >
          Knowledge Base
        </button>

        <ChevronRight size={13} />

        <span className="max-w-[300px] truncate text-slate-400">
          {article.title}
        </span>
      </div>

      {/* ===================================================
          ARTICLE CARD
      =================================================== */}

      <article className="mt-5 overflow-hidden rounded-3xl border border-slate-800 bg-[#0a1425] shadow-2xl shadow-black/20">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="relative overflow-hidden border-b border-slate-800">
          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-500/[0.07] blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-500/[0.04] blur-3xl" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6">
              {/* META */}

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCategoryStyle(
                    article.category,
                  )}`}
                >
                  {article.category || "General"}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 size={12} />
                  Published
                </span>

                {videoUrl && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400">
                    <Play size={12} />
                    Video Guide
                  </span>
                )}
              </div>

              {/* TITLE */}

              <div className="max-w-5xl">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {article.title || "Knowledge Base Article"}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
                  {String(article.content || "")
                    .replace(/^#+\s?/gm, "")
                    .replace(/\*\*/g, "")
                    .replace(/\r?\n/g, " ")
                    .trim()
                    .substring(0, 180)}
                  {String(article.content || "").length > 180 ? "..." : ""}
                </p>
              </div>

              {/* META INFO */}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-800/80 pt-5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 size={14} />
                  Updated {formatDate(article.updatedAt)}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FileText size={14} />

                  {getReadTime(article)}
                </div>

                {Array.isArray(article.tags) && article.tags.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Tag size={14} />
                    {article.tags.length} tags
                  </div>
                )}
              </div>

              {/* TAGS */}

              {Array.isArray(article.tags) && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-[11px] text-slate-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-10">
          {/* =================================================
              MAIN
          ================================================= */}

          <main className="min-w-0">
            {/* ARTICLE CONTENT */}

            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/10 bg-blue-500/10 text-blue-400">
                  <FileText size={18} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">Article</h2>

                  <p className="text-xs text-slate-600">
                    Troubleshooting information
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5 sm:p-7 lg:p-8">
                {renderContent(article.content)}
              </div>
            </section>

            {/* SOLUTION */}

            {article.solution && (
              <section className="mt-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/10 bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={18} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Recommended Solution
                    </h2>

                    <p className="text-xs text-slate-600">
                      Verified resolution steps
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.035] p-5 sm:p-7 lg:p-8">
                  {renderContent(article.solution)}
                </div>
              </section>
            )}

            {/* VIDEO */}

            {videoUrl && (
              <section className="mt-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/10 bg-violet-500/10 text-violet-400">
                    <Play size={18} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Video Solution
                    </h2>

                    <p className="text-xs text-slate-600">
                      Visual troubleshooting guide
                    </p>
                  </div>
                </div>

                {youtubeId ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title={article.title || "Knowledge Base video solution"}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-950/30 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                        <Play size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          External video available
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Open the video guide in a new tab.
                        </p>
                      </div>
                    </div>

                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      Watch Video
                      <ExternalLink size={15} />
                    </a>
                  </div>
                )}
              </section>
            )}
          </main>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="lg:sticky lg:top-6 lg:self-start">
            {/* ARTICLE INFORMATION */}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-blue-400" />

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Article Information
                </p>
              </div>

              <div className="mt-5 divide-y divide-slate-800/80">
                <div className="pb-4">
                  <p className="text-xs text-slate-600">Category</p>

                  <p className="mt-1.5 text-sm font-medium text-slate-300">
                    {article.category || "General"}
                  </p>
                </div>

                <div className="py-4">
                  <p className="text-xs text-slate-600">Last Updated</p>

                  <p className="mt-1.5 text-sm font-medium text-slate-300">
                    {formatDate(article.updatedAt)}
                  </p>
                </div>

                <div className="py-4">
                  <p className="text-xs text-slate-600">Reading Time</p>

                  <p className="mt-1.5 text-sm font-medium text-slate-300">
                    {getReadTime(article)}
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-slate-600">Resource Type</p>

                  <p className="mt-1.5 text-sm font-medium text-slate-300">
                    Support Guide
                  </p>
                </div>
              </div>
            </div>

            {/* AGENT TIP */}

            <div className="mt-4 rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-5">
              <div className="flex items-start gap-3">
                <BookOpen size={17} className="mt-0.5 shrink-0 text-blue-400" />

                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Agent Tip
                  </p>

                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    Use this guide to quickly find verified troubleshooting
                    steps while assisting customers.
                  </p>
                </div>
              </div>
            </div>

            {/* BACK */}

            <button
              type="button"
              onClick={() => navigate("/agent/knowledge-base")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#0a1425] px-4 py-3 text-xs font-semibold text-slate-500 transition hover:border-blue-500/30 hover:text-white"
            >
              <ArrowLeft size={14} />
              Browse All Articles
            </button>
          </aside>
        </div>
      </article>
    </div>
  );
};

export default KnowledgeBaseDetails;
