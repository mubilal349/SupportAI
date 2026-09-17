import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Tag,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  ArrowRight,
  Video,
} from "lucide-react";

import {
  getAllKnowledgeBaseArticles,
  searchKnowledgeBase,
  deleteKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
} from "../../../services/adminKnowledgeBaseService.js";

const KnowledgeBase = () => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteArticle, setDeleteArticle] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD ARTICLES
  // ============================================================

  const loadArticles = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = searchQuery.trim()
          ? await searchKnowledgeBase(searchQuery)
          : await getAllKnowledgeBaseArticles();

        setArticles(response?.articles || []);
      } catch (err) {
        console.error("Load Knowledge Base error:", err);

        setError(err.message || "Failed to load Knowledge Base articles.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery],
  );

  // ============================================================
  // INITIAL LOAD / SEARCH
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(
      () => {
        loadArticles();
      },
      searchQuery.trim() ? 350 : 0,
    );

    return () => clearTimeout(timer);
  }, [searchQuery, loadArticles]);

  // ============================================================
  // OPEN ARTICLE
  // ============================================================

  const handleOpenArticle = (article) => {
    if (!article?._id) {
      setError("Unable to open this article because its ID is missing.");
      return;
    }

    navigate(`/admin/knowledge-base/${article._id}`);
  };

  // ============================================================
  // EDIT ARTICLE
  // ============================================================

  const handleEditArticle = (article) => {
    if (!article?._id) {
      setError("Unable to edit this article because its ID is missing.");
      return;
    }

    navigate(`/admin/knowledge-base/${article._id}/edit`);
  };

  // ============================================================
  // CATEGORIES
  // ============================================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(articles.map((article) => article.category).filter(Boolean)),
    ];

    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  }, [articles]);

  // ============================================================
  // FILTERED ARTICLES
  // ============================================================

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const categoryMatch =
        categoryFilter === "all" || article.category === categoryFilter;

      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "published" && article.isPublished) ||
        (statusFilter === "draft" && !article.isPublished);

      return categoryMatch && statusMatch;
    });
  }, [articles, categoryFilter, statusFilter]);

  // ============================================================
  // DELETE ARTICLE
  // ============================================================

  const handleDelete = async () => {
    if (!deleteArticle?._id) return;

    try {
      setDeleting(true);
      setError("");

      await deleteKnowledgeBaseArticle(deleteArticle._id);

      setArticles((current) =>
        current.filter((article) => article._id !== deleteArticle._id),
      );

      setDeleteArticle(null);

      setSuccess("Knowledge Base article deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Delete article error:", err);

      setError(err.message || "Failed to delete Knowledge Base article.");
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // TOGGLE PUBLISH STATUS
  // ============================================================

  const handleTogglePublished = async (article) => {
    try {
      setError("");

      const response = await updateKnowledgeBaseArticle(article._id, {
        isPublished: !article.isPublished,
      });

      const updatedArticle = response?.article || {
        ...article,
        isPublished: !article.isPublished,
      };

      setArticles((current) =>
        current.map((item) =>
          item._id === article._id ? updatedArticle : item,
        ),
      );

      setSuccess(
        updatedArticle.isPublished
          ? "Article published successfully."
          : "Article moved to draft successfully.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Toggle article status error:", err);

      setError(err.message || "Failed to update article publication status.");
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-full bg-[#050b18] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                <BookOpen size={21} className="text-blue-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Knowledge Base
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Create, manage, and publish support articles.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/knowledge-base/new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500"
          >
            <Plus size={18} />
            New Article
          </button>
        </div>

        {/* ================================================== */}
        {/* ALERTS */}
        {/* ================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />

            <div className="flex-1">{error}</div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-300/70 hover:text-red-200"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={18} />

            <span>{success}</span>
          </div>
        )}

        {/* ================================================== */}
        {/* STATS */}
        {/* ================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Articles</p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {articles.length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <FileText size={19} className="text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Published</p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {articles.filter((article) => article.isPublished).length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Eye size={19} className="text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a1222] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Drafts</p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {articles.filter((article) => !article.isPublished).length}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <EyeOff size={19} className="text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* FILTERS */}
        {/* ================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-[#0a1222] p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search articles, solutions, tags..."
                className="h-11 w-full rounded-xl border border-slate-700 bg-[#050b18] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/60"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-700 bg-[#050b18] px-4 text-sm text-slate-200 outline-none focus:border-blue-500/60"
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-700 bg-[#050b18] px-4 text-sm text-slate-200 outline-none focus:border-blue-500/60"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <button
              type="button"
              onClick={() => loadArticles(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#050b18] px-4 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ================================================== */}
        {/* CONTENT */}
        {/* ================================================== */}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-800 bg-[#0a1222]">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 size={28} className="animate-spin text-blue-400" />

              <span className="text-sm">Loading Knowledge Base...</span>
            </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0a1222] px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
              <BookOpen size={25} className="text-slate-500" />
            </div>

            <h3 className="text-lg font-semibold text-white">
              No articles found
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-400">
              {searchQuery || categoryFilter !== "all"
                ? "Try changing your search or filters."
                : "Create your first Knowledge Base article to get started."}
            </p>

            {!searchQuery && categoryFilter === "all" && (
              <button
                type="button"
                onClick={() => navigate("/admin/knowledge-base/new")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                <Plus size={17} />
                Create Article
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1222]">
            {/* ================================================== */}
            {/* DESKTOP TABLE */}
            {/* ================================================== */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#08101e]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Article
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Category
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tags
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Updated
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredArticles.map((article) => (
                    <tr
                      key={article._id}
                      className="border-b border-slate-800/70 transition hover:bg-slate-800/20"
                    >
                      {/* ARTICLE */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleOpenArticle(article)}
                          className="group block max-w-md text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-500/20">
                              <BookOpen size={16} />
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-white transition-colors group-hover:text-blue-400">
                                {article.title}
                              </p>

                              <p className="mt-1 line-clamp-2 text-sm text-slate-500 transition-colors group-hover:text-slate-400">
                                {article.content}
                              </p>

                              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                                Read article
                                <ArrowRight size={12} />
                              </span>
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* CATEGORY */}
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300">
                          {article.category || "General"}
                        </span>
                      </td>

                      {/* TAGS + VIDEO */}
                      <td className="px-5 py-4">
                        <div className="flex max-w-[250px] flex-wrap gap-1.5">
                          {(article.tags || []).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[11px] text-blue-300"
                            >
                              <Tag size={11} />
                              {tag}
                            </span>
                          ))}

                          {(article.tags || []).length > 3 && (
                            <span className="text-xs text-slate-500">
                              +{(article.tags || []).length - 3}
                            </span>
                          )}

                          {article.solutionVideoUrl?.trim() && (
                            <span
                              title="This article has a solution video"
                              className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-1 text-[11px] font-medium text-purple-300"
                            >
                              <Video size={11} />
                              Video
                            </span>
                          )}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleTogglePublished(article)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                            article.isPublished
                              ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                          }`}
                        >
                          {article.isPublished ? (
                            <>
                              <Eye size={13} />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff size={13} />
                              Draft
                            </>
                          )}
                        </button>
                      </td>

                      {/* UPDATED */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-400">
                        {formatDate(article.updatedAt)}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {/* VIEW */}
                          <button
                            type="button"
                            title="View article"
                            onClick={() => handleOpenArticle(article)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                          >
                            <Eye size={16} />
                          </button>

                          {/* EDIT */}
                          <button
                            type="button"
                            title="Edit article"
                            onClick={() => handleEditArticle(article)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300"
                          >
                            <Pencil size={16} />
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            title="Delete article"
                            onClick={() => setDeleteArticle(article)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================================================== */}
            {/* MOBILE CARDS */}
            {/* ================================================== */}

            <div className="divide-y divide-slate-800 lg:hidden">
              {filteredArticles.map((article) => (
                <div key={article._id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => handleOpenArticle(article)}
                      className="group min-w-0 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                          <BookOpen size={16} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-semibold text-white transition-colors group-hover:text-blue-400">
                            {article.title}
                          </h3>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {article.content}
                          </p>

                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-400">
                            Read article
                            <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePublished(article)}
                      className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                        article.isPublished
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {article.isPublished ? "Published" : "Draft"}
                    </button>
                  </div>

                  {/* CATEGORY + TAGS + VIDEO */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                      {article.category || "General"}
                    </span>

                    {(article.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300"
                      >
                        #{tag}
                      </span>
                    ))}

                    {article.solutionVideoUrl?.trim() && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300">
                        <Video size={13} />
                        Video
                      </span>
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Updated {formatDate(article.updatedAt)}
                    </span>

                    <div className="flex gap-2">
                      {/* VIEW */}
                      <button
                        type="button"
                        title="View article"
                        onClick={() => handleOpenArticle(article)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                      >
                        <Eye size={16} />
                      </button>

                      {/* EDIT */}
                      <button
                        type="button"
                        title="Edit article"
                        onClick={() => handleEditArticle(article)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300"
                      >
                        <Pencil size={16} />
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        title="Delete article"
                        onClick={() => setDeleteArticle(article)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* DELETE MODAL */}
      {/* ====================================================== */}

      {deleteArticle && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0a1222] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
              <Trash2 size={22} className="text-red-400" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-white">
              Delete Article?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-200">
                "{deleteArticle.title}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteArticle(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}

                {deleting ? "Deleting..." : "Delete Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
