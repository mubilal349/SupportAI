import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  X,
  Plus,
  AlertCircle,
  Video,
  ExternalLink,
} from "lucide-react";

import {
  getKnowledgeBaseArticle,
  createKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
} from "../../../services/adminKnowledgeBaseService.js";

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();

  const isEditing = Boolean(articleId);

  const [form, setForm] = useState({
    title: "",
    category: "General",
    content: "",
    solution: "",
    solutionVideoUrl: "",
    tags: [],
    isPublished: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD ARTICLE FOR EDITING
  // ==========================================

  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getKnowledgeBaseArticle(articleId);

        if (!response?.article) {
          throw new Error("Article not found.");
        }

        const article = response.article;

        setForm({
          title: article.title || "",
          category: article.category || "General",
          content: article.content || "",
          solution: article.solution || "",
          solutionVideoUrl: article.solutionVideoUrl || "",
          tags: Array.isArray(article.tags) ? article.tags : [],
          isPublished: Boolean(article.isPublished),
        });
      } catch (err) {
        console.error("Load Knowledge Base article error:", err);

        setError(err.message || "Failed to load the Knowledge Base article.");
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [articleId]);

  // ==========================================
  // UPDATE FORM
  // ==========================================

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================
  // ADD TAG
  // ==========================================

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();

    if (!tag) {
      return;
    }

    if (form.tags.includes(tag)) {
      setTagInput("");
      return;
    }

    setForm((current) => ({
      ...current,
      tags: [...current.tags, tag],
    }));

    setTagInput("");
  };

  // ==========================================
  // REMOVE TAG
  // ==========================================

  const removeTag = (tagToRemove) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // ==========================================
  // TAG ENTER KEY
  // ==========================================

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // ==========================================
  // VIDEO URL VALIDATION
  // ==========================================

  const validateVideoUrl = (url) => {
    const trimmedUrl = url.trim();

    // Video URL is optional.
    if (!trimmedUrl) {
      return "";
    }

    try {
      const parsedUrl = new URL(trimmedUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return "Video URL must start with http:// or https://";
      }

      return "";
    } catch {
      return "Please enter a valid video URL.";
    }
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Article title is required.";
    }

    if (!form.category.trim()) {
      return "Category is required.";
    }

    if (!form.content.trim()) {
      return "Article content is required.";
    }

    if (!form.solution.trim()) {
      return "Solution is required.";
    }

    const videoError = validateVideoUrl(form.solutionVideoUrl);

    if (videoError) {
      return videoError;
    }

    return "";
  };

  // ==========================================
  // SAVE ARTICLE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        title: form.title.trim(),
        category: form.category.trim(),
        content: form.content.trim(),
        solution: form.solution.trim(),
        solutionVideoUrl: form.solutionVideoUrl.trim(),
        tags: form.tags,
        isPublished: form.isPublished,
      };

      if (isEditing) {
        await updateKnowledgeBaseArticle(articleId, payload);
        setSuccess("Article updated successfully.");
      } else {
        await createKnowledgeBaseArticle(payload);
        setSuccess("Article created successfully.");
      }

      setTimeout(() => {
        navigate("/admin/knowledge-base");
      }, 700);
    } catch (err) {
      console.error("Save Knowledge Base article error:", err);

      setError(
        err.message ||
          `Failed to ${isEditing ? "update" : "create"} the article.`,
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // PREVIEW
  // ==========================================

  const handlePreview = () => {
    if (!form.title.trim() && !form.content.trim()) {
      setError("Add some article content before previewing.");
      return;
    }

    alert(
      `Preview:\n\n${form.title || "Untitled Article"}\n\n${
        form.content || "No content."
      }\n\nSolution:\n${form.solution || "No solution."}\n\nVideo:\n${
        form.solutionVideoUrl || "No video added."
      }`,
    );
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin" size={28} />
          <p className="text-sm">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      {/* BACK BUTTON */}
      <button
        type="button"
        onClick={() => navigate("/admin/knowledge-base")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Knowledge Base
      </button>

      {/* HEADER */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Knowledge Base
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">
          {isEditing ? "Edit Article" : "Create Article"}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {isEditing
            ? "Update the article information, solution, video, tags, and publication status."
            : "Create a support article that agents can use while helping customers."}
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />

          <div className="flex-1">{error}</div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 transition hover:text-red-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="max-w-5xl">
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          {/* TITLE */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Article Title
            </label>

            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Enter article title"
              maxLength={200}
              disabled={saving}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-1 text-right text-xs text-slate-600">
              {form.title.length}/200
            </div>
          </div>

          {/* CATEGORY + PUBLISH STATUS */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Category
              </label>

              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="General">General</option>
                <option value="Account">Account</option>
                <option value="Payments">Payments</option>
                <option value="Billing">Billing</option>
                <option value="Technical">Technical</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Publication Status
              </label>

              <select
                value={form.isPublished ? "published" : "draft"}
                onChange={(e) =>
                  update("isPublished", e.target.value === "published")
                }
                disabled={saving}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* CONTENT */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Article Content
            </label>

            <textarea
              rows={12}
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              placeholder="Describe the customer issue, context, symptoms, and relevant information..."
              disabled={saving}
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-2 text-xs text-slate-600">
              Explain the issue clearly so support agents understand the
              situation.
            </p>
          </div>

          {/* SOLUTION */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Solution
            </label>

            <textarea
              rows={10}
              value={form.solution}
              onChange={(e) => update("solution", e.target.value)}
              placeholder="Provide the recommended solution or steps the support agent should follow..."
              disabled={saving}
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-2 text-xs text-slate-600">
              This solution can be searched by agents while replying to
              customers.
            </p>
          </div>

          {/* SOLUTION VIDEO */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Video size={16} className="text-blue-400" />

              <label className="text-xs font-medium text-slate-400">
                Solution Video URL
              </label>

              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-500">
                Optional
              </span>
            </div>

            <input
              type="url"
              value={form.solutionVideoUrl}
              onChange={(e) => update("solutionVideoUrl", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={saving}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-2 text-xs leading-5 text-slate-600">
              Add an optional YouTube or video URL that demonstrates the
              solution. Customers will see it when viewing the published
              article.
            </p>

            {/* VIDEO URL PREVIEW */}
            {form.solutionVideoUrl.trim() && (
              <div className="mt-3 flex flex-col gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <Video size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">
                      Solution video added
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {form.solutionVideoUrl}
                    </p>
                  </div>
                </div>

                <a
                  href={form.solutionVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <ExternalLink size={14} />
                  Test Link
                </a>
              </div>
            )}
          </div>

          {/* TAGS */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Tags
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter"
                disabled={saving}
                className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="button"
                onClick={addTag}
                disabled={saving || !tagInput.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            {form.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1.5 text-xs text-blue-300"
                  >
                    <span>#{tag}</span>

                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      disabled={saving}
                      className="text-blue-400 transition hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-slate-600">
              Add keywords such as password, login, account, billing, or
              payment.
            </p>
          </div>

          {/* PUBLISH INFO */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                  form.isPublished ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />

              <div>
                <p className="text-sm font-medium text-slate-200">
                  {form.isPublished
                    ? "Article will be published"
                    : "Article will remain a draft"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {form.isPublished
                    ? "Agents will be able to find and use this article in the Knowledge Base."
                    : "The article will be saved but won't appear in the published Knowledge Base."}
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/knowledge-base")}
              disabled={saving}
              className="rounded-xl border border-slate-800 px-5 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePreview}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye size={16} />
              Preview
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? "Update Article" : "Save Article"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor;
