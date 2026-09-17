import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Loader2,
  AlertCircle,
  Calendar,
  Tag,
  BookOpen,
  CheckCircle2,
  XCircle,
  Video,
  ExternalLink,
  Lightbulb,
  Play,
} from "lucide-react";

import { getKnowledgeBaseArticle } from "../../../services/adminKnowledgeBaseService.js";

const ArticleView = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD ARTICLE
  // ==========================================

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getKnowledgeBaseArticle(articleId);

        setArticle(response?.article || response?.data || response || null);
      } catch (err) {
        console.error("Failed to load knowledge base article:", err);

        setError(
          err?.message || "Unable to load this article. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  // ==========================================
  // EDIT ARTICLE
  // ==========================================

  const handleEdit = () => {
    navigate(`/admin/knowledge-base/${articleId}/edit`);
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ==========================================
  // EXTRACT YOUTUBE VIDEO ID
  // ==========================================

  const getYouTubeVideoId = (url) => {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url.trim());

      // youtube.com/watch?v=VIDEO_ID
      if (
        parsedUrl.hostname === "www.youtube.com" ||
        parsedUrl.hostname === "youtube.com" ||
        parsedUrl.hostname === "m.youtube.com"
      ) {
        if (parsedUrl.pathname === "/watch") {
          return parsedUrl.searchParams.get("v");
        }

        // youtube.com/shorts/VIDEO_ID
        if (parsedUrl.pathname.startsWith("/shorts/")) {
          return parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0];
        }

        // youtube.com/embed/VIDEO_ID
        if (parsedUrl.pathname.startsWith("/embed/")) {
          return parsedUrl.pathname.split("/embed/")[1]?.split("/")[0];
        }
      }

      // youtu.be/VIDEO_ID
      if (parsedUrl.hostname === "youtu.be") {
        return parsedUrl.pathname.replace("/", "").split("/")[0];
      }

      return null;
    } catch {
      return null;
    }
  };

  // ==========================================
  // VIDEO DATA
  // ==========================================

  const videoInfo = useMemo(() => {
    if (!article?.solutionVideoUrl) {
      return {
        youtubeId: null,
        url: "",
      };
    }

    const url = article.solutionVideoUrl.trim();

    return {
      youtubeId: getYouTubeVideoId(url),
      url,
    };
  }, [article?.solutionVideoUrl]);

  // ==========================================
  // TAGS
  // ==========================================

  const tags = Array.isArray(article?.tags)
    ? article.tags
    : typeof article?.tags === "string"
      ? article.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#050b18]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />

          <p className="text-sm text-slate-400">Loading article...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error || !article) {
    return (
      <div className="min-h-[70vh] bg-[#050b18] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => navigate("/admin/knowledge-base")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Knowledge Base
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-400" />

            <h2 className="mt-4 text-xl font-bold text-white">
              Article Not Found
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {error ||
                "The requested knowledge base article could not be found."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/knowledge-base")}
              className="mt-6 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Back to Articles
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#050b18] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER ACTIONS */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/admin/knowledge-base")}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Knowledge Base
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            <Edit3 className="h-4 w-4" />
            Edit Article
          </button>
        </div>

        {/* ARTICLE */}
        <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          {/* ARTICLE HEADER */}
          <div className="border-b border-slate-800 px-5 py-7 sm:px-8 sm:py-9">
            <div className="flex flex-wrap items-center gap-3">
              {article.category && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                  <BookOpen className="h-3.5 w-3.5" />
                  {article.category}
                </span>
              )}

              {article.isPublished ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  <XCircle className="h-3.5 w-3.5" />
                  Draft
                </span>
              )}
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {article.title}
            </h1>

            {article.description && (
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
                {article.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-500">
              {(article.updatedAt || article.createdAt) && (
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Updated {formatDate(article.updatedAt || article.createdAt)}
                </span>
              )}

              {article.author && (
                <span>
                  By{" "}
                  <span className="font-medium text-slate-300">
                    {typeof article.author === "object"
                      ? article.author.name || article.author.email || "Admin"
                      : article.author}
                  </span>
                </span>
              )}
            </div>

            {tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-300"
                  >
                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ARTICLE CONTENT */}
          <div className="border-b border-slate-800 px-5 py-8 sm:px-8 sm:py-10">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />

              <h2 className="text-lg font-semibold text-white">
                Article Content
              </h2>
            </div>

            <div className="max-w-none whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-300">
              {article.content || "This article does not have any content yet."}
            </div>
          </div>

          {/* SOLUTION */}
          <div className="border-b border-slate-800 px-5 py-8 sm:px-8 sm:py-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Lightbulb className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">Solution</h2>

                <p className="text-xs text-slate-500">
                  Recommended solution for this support issue
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-5">
              <div className="whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-300">
                {article.solution ||
                  "This article does not have a solution yet."}
              </div>
            </div>
          </div>

          {/* SOLUTION VIDEO */}
          {videoInfo.url && (
            <div className="px-5 py-8 sm:px-8 sm:py-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Video className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Video Solution
                    </h2>

                    <p className="text-xs text-slate-500">
                      Step-by-step video demonstrating the solution
                    </p>
                  </div>
                </div>

                <a
                  href={videoInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white sm:inline-flex"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Video
                </a>
              </div>

              {videoInfo.youtubeId ? (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-lg">
                  <div className="aspect-video w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoInfo.youtubeId}`}
                      title={`Video solution for ${article.title}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                        <Play className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                          Video solution available
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {videoInfo.url}
                        </p>
                      </div>
                    </div>

                    <a
                      href={videoInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      <Play className="h-4 w-4" />
                      Watch Video
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-3 sm:hidden">
                <a
                  href={videoInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open video in new tab
                </a>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default ArticleView;
