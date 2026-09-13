import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Eye } from "lucide-react";

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();

  const isEditing = Boolean(articleId);

  const [form, setForm] = useState({
    title: isEditing ? "How to reset your password" : "",
    category: isEditing ? "Account" : "General",
    content: isEditing
      ? "Follow these steps to reset your SupportAI account password..."
      : "",
    status: "draft",
  });

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Article:", form);

    navigate("/admin/knowledge-base");
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate("/admin/knowledge-base")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Knowledge Base
      </button>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Knowledge Base
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white">
          {isEditing ? "Edit Article" : "Create Article"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-[#0a1222] p-5 sm:p-6">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Article Title
            </label>

            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Enter article title"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Category
              </label>

              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none"
              >
                <option>General</option>
                <option>Account</option>
                <option>Payments</option>
                <option>Billing</option>
                <option>Technical</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Status
              </label>

              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Article Content
            </label>

            <textarea
              rows={14}
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              placeholder="Write your knowledge base article..."
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/knowledge-base")}
              className="rounded-xl border border-slate-800 px-5 py-2.5 text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-900"
            >
              <Eye size={16} />
              Preview
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Save size={16} />
              Save Article
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor;
