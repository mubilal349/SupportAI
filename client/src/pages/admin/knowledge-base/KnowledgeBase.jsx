import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  BookOpen,
  FileText,
  Eye,
  MoreVertical,
} from "lucide-react";

const mockArticles = [
  {
    _id: "kb-1",
    title: "How to reset your password",
    category: "Account",
    status: "published",
    views: 1248,
    updated: "2 days ago",
  },
  {
    _id: "kb-2",
    title: "Troubleshooting payment failures",
    category: "Payments",
    status: "published",
    views: 932,
    updated: "4 days ago",
  },
  {
    _id: "kb-3",
    title: "Understanding your subscription",
    category: "Billing",
    status: "draft",
    views: 0,
    updated: "Yesterday",
  },
  {
    _id: "kb-4",
    title: "Contacting customer support",
    category: "General",
    status: "published",
    views: 674,
    updated: "1 week ago",
  },
];

const KnowledgeBase = () => {
  const navigate = useNavigate();

  const [articles] = useState(mockArticles);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.category.toLowerCase().includes(search.toLowerCase()),
    );
  }, [articles, search]);

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">Knowledge Base</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage support articles used by customers and agents.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/knowledge-base/new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus size={17} />
          New Article
        </button>
      </div>

      <div className="mb-5 relative">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search knowledge base..."
          className="w-full rounded-2xl border border-slate-800 bg-[#0a1222] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((article) => (
          <div
            key={article._id}
            className="group rounded-2xl border border-slate-800 bg-[#0a1222] p-5 transition hover:border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <BookOpen size={18} />
              </div>

              <button type="button" className="text-slate-600 hover:text-white">
                <MoreVertical size={17} />
              </button>
            </div>

            <h2 className="mt-5 line-clamp-2 text-sm font-semibold text-white">
              {article.title}
            </h2>

            <p className="mt-2 text-xs text-slate-600">{article.category}</p>

            <div className="mt-5 flex items-center justify-between text-xs">
              <span
                className={`rounded-lg px-2 py-1 capitalize ${
                  article.status === "published"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {article.status}
              </span>

              <span className="flex items-center gap-1 text-slate-600">
                <Eye size={13} />
                {article.views}
              </span>
            </div>

            <div className="mt-4 border-t border-slate-800 pt-3 text-[11px] text-slate-600">
              Updated {article.updated}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/admin/knowledge-base/${article._id}`)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 py-2 text-xs text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              <FileText size={14} />
              Open Article
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBase;
